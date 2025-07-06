import { ApiHelpers } from "@/lib/api-helpers";
import { AuthService } from "@/lib/auth";
import { AUTH_CONSTANTS, HTTP_STATUS, MESSAGES } from "@/lib/constants";
import { DatabaseService } from "@/lib/db";
import { TwoFAService } from "@/lib/twofa";
import { loginSchema } from "@/lib/validations";
import type { AuthResponse } from "@/types/auth";
import { NextRequest } from "next/server";

export const POST = ApiHelpers.asyncHandler(async (request: NextRequest) => {
  // Validate request body
  const validation = await ApiHelpers.validateRequestBody(request, loginSchema);
  if (!validation.success) {
    return validation.response;
  }

  const { email, password } = validation.data;
  const clientInfo = ApiHelpers.getClientInfo(request);

  // Check rate limiting
  const rateLimit = await ApiHelpers.checkRateLimit(
    request,
    "login",
    AUTH_CONSTANTS.RATE_LIMIT.LOGIN.MAX_ATTEMPTS,
    AUTH_CONSTANTS.RATE_LIMIT.LOGIN.WINDOW_MINUTES
  );

  if (!rateLimit.allowed) {
    return rateLimit.response!;
  }

  try {
    // Get user by email
    const user = await AuthService.getUserByEmail(email);
    if (!user) {
      await DatabaseService.logAuditEvent({
        action: "login_user_not_found",
        details: { email },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
      });

      return ApiHelpers.errorResponse(
        MESSAGES.ERROR.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(
      password,
      user.password
    );
    if (!isValidPassword) {
      await DatabaseService.logAuditEvent({
        userId: user.id,
        action: "login_invalid_password",
        details: { email },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
      });

      return ApiHelpers.errorResponse(
        MESSAGES.ERROR.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Send 2FA code
    const twoFAResult = await TwoFAService.sendCode(
      user.id,
      user.email,
      clientInfo.ipAddress
    );

    if (!twoFAResult.success) {
      await DatabaseService.logAuditEvent({
        userId: user.id,
        action: "login_2fa_send_failed",
        details: { email, error: twoFAResult.message },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
      });

      return ApiHelpers.errorResponse(
        twoFAResult.message,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    // Log successful login attempt (pending 2FA)
    await DatabaseService.logAuditEvent({
      userId: user.id,
      action: "login_success_pending_2fa",
      details: {
        email,
        codeId: twoFAResult.data?.codeId,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    });

    const response: AuthResponse = {
      success: true,
      message: MESSAGES.SUCCESS.LOGIN,
      requires2FA: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
    };

    return ApiHelpers.successResponse(response.message, {
      requires2FA: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    await DatabaseService.logAuditEvent({
      action: "login_internal_error",
      details: {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: false,
    });

    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.INTERNAL,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
});

// Handle OPTIONS for CORS
export const OPTIONS = ApiHelpers.handleOptions;
