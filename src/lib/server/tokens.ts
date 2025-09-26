import { db } from "./db";
import { verificationTokens } from "./db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { EmailService } from "./email";

export type TokenType = "email_verification" | "password_reset" | "verification_code" | "password_reset_code" | "password_change_code";

export class TokenService {
  // Generate a 6-digit verification code
  static generateVerificationCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated verification code:", code);
    return code;
  }

  static async createToken(
    userId: string,
    email: string,
    type: TokenType,
    expiresInHours: number = 24
  ): Promise<string> {
    // Clean up any existing tokens of the same type for this user
    await this.cleanupExpiredTokens(userId, type);

    let token: string;
    
    if (type === "verification_code" || type === "password_reset_code" || type === "password_change_code") {
      token = this.generateVerificationCode();
    } else if (type === "email_verification") {
      token = EmailService.generateVerificationToken();
    } else {
      token = EmailService.generatePasswordResetToken();
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    console.log("Creating token:", {
      userId,
      email,
      type,
      token: type.includes("code") ? token : token.substring(0, 10) + "...",
      expiresAt,
    });

    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires: expiresAt,
      type,
      userId,
    });

    console.log("Token created successfully");
    return token;
  }

  static async validateToken(
    token: string,
    type: TokenType
  ): Promise<{
    valid: boolean;
    userId?: string;
    email?: string;
  }> {
    try {
      console.log("Validating token:", {
        token: token.substring(0, 10) + "...",
        type,
      });

      const tokenRecord = await db.query.verificationTokens.findFirst({
        where: and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.type, type),
          gt(verificationTokens.expires, new Date())
        ),
      });

      console.log("Token record found:", tokenRecord ? "Yes" : "No");

      if (!tokenRecord) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: tokenRecord.userId,
        email: tokenRecord.identifier,
      };
    } catch (error) {
      console.error("Error validating token:", error);
      return { valid: false };
    }
  }

  static async consumeToken(
    token: string,
    type: TokenType
  ): Promise<{
    success: boolean;
    userId?: string;
    email?: string;
  }> {
    const validation = await this.validateToken(token, type);

    if (!validation.valid) {
      return { success: false };
    }

    try {
      // Delete the token after successful validation
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));

      return {
        success: true,
        userId: validation.userId,
        email: validation.email,
      };
    } catch (error) {
      console.error("Error consuming token:", error);
      return { success: false };
    }
  }

  static async cleanupExpiredTokens(
    userId?: string,
    type?: TokenType
  ): Promise<void> {
    try {
      const conditions = [lt(verificationTokens.expires, new Date())];

      if (userId) {
        conditions.push(eq(verificationTokens.userId, userId));
      }

      if (type) {
        conditions.push(eq(verificationTokens.type, type));
      }

      await db.delete(verificationTokens).where(and(...conditions));
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  static async sendEmailVerification(
    userId: string,
    email: string,
    name: string,
    context: string = "registration"
  ): Promise<boolean> {
    try {
      const token = await this.createToken(
        userId,
        email,
        "email_verification",
        24
      );
      return await EmailService.sendEmailVerification(
        email,
        name,
        token,
        context
      );
    } catch (error) {
      console.error("Error sending email verification:", error);
      return false;
    }
  }

  static async sendPasswordReset(
    userId: string,
    email: string,
    name: string
  ): Promise<boolean> {
    try {
      const token = await this.createToken(userId, email, "password_reset", 1); // 1 hour expiry
      return await EmailService.sendPasswordReset(email, name, token);
    } catch (error) {
      console.error("Error sending password reset:", error);
      return false;
    }
  }

  // Create and send verification code
  static async createVerificationCode(
    userId: string,
    email: string,
    name: string,
    expiresInMinutes: number = 10
  ): Promise<string> {
    console.log("=== Creating verification code ===");
    console.log("Parameters:", { userId, email, name, expiresInMinutes });
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    // Clean up any existing verification codes for this user
    console.log("Cleaning up existing verification codes for user:", userId);
    await this.cleanupExpiredTokens(userId, "verification_code");
    
    const code = this.generateVerificationCode();
    
    console.log("Storing verification code in database:", { userId, email, code, expiresAt });
    
    await db.insert(verificationTokens).values({
      identifier: email,
      token: code,
      expires: expiresAt,
      type: "verification_code",
      userId,
    });
    
    console.log("Verification code stored successfully in database");
    
    // Send email with verification code
    try {
      const emailSent = await EmailService.sendVerificationCode(email, name, code);
      console.log("Verification code email sent:", { userId, email, code, emailSent, expiresAt });
    } catch (error) {
      console.error("Error sending verification code email:", error);
    }
    
    return code;
  }

  // Create and send password reset code
  static async createPasswordResetCode(
    userId: string,
    email: string,
    name: string,
    expiresInMinutes: number = 10
  ): Promise<string> {
    console.log("=== Creating password reset code ===");
    console.log("Parameters:", { userId, email, name, expiresInMinutes });
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    // Clean up any existing password reset codes for this user
    console.log("Cleaning up existing password reset codes for user:", userId);
    await this.cleanupExpiredTokens(userId, "password_reset_code");
    
    const code = this.generateVerificationCode();
    
    console.log("Storing password reset code in database:", { userId, email, code, expiresAt });
    
    await db.insert(verificationTokens).values({
      identifier: email,
      token: code,
      expires: expiresAt,
      type: "password_reset_code",
      userId,
    });
    
    console.log("Password reset code stored successfully in database");
    
    // Send email with password reset code
    try {
      const emailSent = await EmailService.sendPasswordResetCode(email, name, code);
      console.log("Password reset code email sent:", { userId, email, code, emailSent, expiresAt });
    } catch (error) {
      console.error("Error sending password reset code email:", error);
    }
    
    console.log("Password reset code created:", { userId, email, code, expiresAt });
    return code;
  }

  // Create and send password change verification code
  static async createPasswordChangeCode(
    userId: string,
    email: string,
    name: string,
    expiresInMinutes: number = 10
  ): Promise<string> {
    console.log("=== Creating password change verification code ===");
    console.log("Parameters:", { userId, email, name, expiresInMinutes });
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    // Clean up any existing password change codes for this user
    console.log("Cleaning up existing password change codes for user:", userId);
    await this.cleanupExpiredTokens(userId, "password_change_code");
    
    const code = this.generateVerificationCode();
    
    console.log("Storing password change code in database:", { userId, email, code, expiresAt });
    
    await db.insert(verificationTokens).values({
      identifier: email,
      token: code,
      expires: expiresAt,
      type: "password_change_code",
      userId,
    });
    
    console.log("Password change code stored successfully in database");
    
    // Send email with password change verification code
    try {
      const emailSent = await EmailService.sendPasswordChangeCode(email, name, code);
      console.log("Password change code email sent:", { userId, email, code, emailSent, expiresAt });
    } catch (error) {
      console.error("Error sending password change code email:", error);
    }
    
    console.log("Password change code created:", { userId, email, code, expiresAt });
    return code;
  }

  // Validate verification code
  static async validateVerificationCode(
    code: string,
    userId: string
  ): Promise<boolean> {
    try {
      console.log("Validating verification code:", { code, userId });
      
      // First, let's see all verification codes for this user
      const allTokens = await db.query.verificationTokens.findMany({
        where: and(
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.type, "verification_code")
        ),
      });
      console.log("All verification tokens for user:", allTokens);
      
      const tokenRecord = await db.query.verificationTokens.findFirst({
        where: and(
          eq(verificationTokens.token, code),
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.type, "verification_code"),
          gt(verificationTokens.expires, new Date())
        ),
      });

      console.log("Token record found:", tokenRecord);
      console.log("Current time:", new Date());
      
      if (tokenRecord) {
        console.log("Token expires at:", tokenRecord.expires);
        console.log("Is token expired?", tokenRecord.expires <= new Date());
      }

      return !!tokenRecord;
    } catch (error) {
      console.error("Error validating verification code:", error);
      return false;
    }
  }

  // Validate password reset code
  static async validatePasswordResetCode(
    code: string,
    email: string
  ): Promise<boolean> {
    try {
      console.log("Validating password reset code:", { code, email });
      
      // First, let's see all password reset tokens for this email
      const allTokens = await db.query.verificationTokens.findMany({
        where: and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "password_reset_code")
        ),
      });
      console.log("All password reset tokens for email:", allTokens);
      
      const now = new Date();
      console.log("Current time for comparison:", now);
      
      // First, find the token without expiration check
      const tokenRecord = await db.query.verificationTokens.findFirst({
        where: and(
          eq(verificationTokens.token, code),
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "password_reset_code")
        ),
      });

      console.log("Password reset token record found (without expiration check):", tokenRecord);
      
      if (!tokenRecord) {
        console.log("No token found with matching code, email, and type");
        return false;
      }
      
      console.log("Token expires at:", tokenRecord.expires);
      console.log("Current time:", now);
      console.log("Is token expired?", tokenRecord.expires <= now);
      
      // Check expiration manually
      const isExpired = tokenRecord.expires <= now;
      if (isExpired) {
        console.log("Token is expired, returning false");
        return false;
      }
      
      console.log("Token is valid and not expired, returning true");
      return true;
    } catch (error) {
      console.error("Error validating password reset code:", error);
      return false;
    }
  }

  // Validate password change code
  static async validatePasswordChangeCode(
    code: string,
    email: string
  ): Promise<boolean> {
    try {
      console.log("Validating password change code:", { code, email });
      
      // First, let's see all password change tokens for this email
      const allTokens = await db.query.verificationTokens.findMany({
        where: and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "password_change_code")
        ),
      });
      console.log("All password change tokens for email:", allTokens);
      
      const now = new Date();
      console.log("Current time for comparison:", now);
      
      // First, find the token without expiration check
      const tokenRecord = await db.query.verificationTokens.findFirst({
        where: and(
          eq(verificationTokens.token, code),
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "password_change_code")
        ),
      });

      console.log("Password change token record found (without expiration check):", tokenRecord);
      
      if (!tokenRecord) {
        console.log("No token found with matching code, email, and type");
        return false;
      }
      
      console.log("Token expires at:", tokenRecord.expires);
      console.log("Current time:", now);
      console.log("Is token expired?", tokenRecord.expires <= now);
      
      // Check expiration manually
      const isExpired = tokenRecord.expires <= now;
      if (isExpired) {
        console.log("Token is expired, returning false");
        return false;
      }
      
      console.log("Token is valid and not expired, returning true");
      return true;
    } catch (error) {
      console.error("Error validating password change code:", error);
      return false;
    }
  }

  // Consume verification code (delete after use)
  static async consumeVerificationCode(
    code: string,
    userId: string
  ): Promise<boolean> {
    try {
      const isValid = await this.validateVerificationCode(code, userId);
      if (!isValid) return false;

      await db
        .delete(verificationTokens)
        .where(and(
          eq(verificationTokens.token, code),
          eq(verificationTokens.userId, userId),
          eq(verificationTokens.type, "verification_code")
        ));

      return true;
    } catch (error) {
      console.error("Error consuming verification code:", error);
      return false;
    }
  }

  // Consume password reset code (delete after use)
  static async consumePasswordResetCode(
    code: string,
    email: string
  ): Promise<boolean> {
    try {
      const isValid = await this.validatePasswordResetCode(code, email);
      if (!isValid) return false;

      await db
        .delete(verificationTokens)
        .where(and(
          eq(verificationTokens.token, code),
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "password_reset_code")
        ));

      console.log("Password reset code consumed successfully");
      return true;
    } catch (error) {
      console.error("Error consuming password reset code:", error);
      return false;
    }
  }

  // Consume password change code (delete after use)
  static async consumePasswordChangeCode(
    code: string,
    email: string
  ): Promise<boolean> {
    try {
      const isValid = await this.validatePasswordChangeCode(code, email);
      if (!isValid) return false;

      await db
        .delete(verificationTokens)
        .where(and(
          eq(verificationTokens.token, code),
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.type, "password_change_code")
        ));

      console.log("Password change code consumed successfully");
      return true;
    } catch (error) {
      console.error("Error consuming password change code:", error);
      return false;
    }
  }
}
