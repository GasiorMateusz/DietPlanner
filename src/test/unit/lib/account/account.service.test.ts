import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteUserAccount } from "@/lib/account/account.service";
import { DatabaseError } from "@/lib/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("deleteUserAccount", () => {
  const userId = "test-user-id";
  let mockSupabase: SupabaseClient;
  let mockAdminSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as unknown as SupabaseClient;

    mockAdminSupabase = {
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as unknown as SupabaseClient;
  });

  it("should successfully delete meal plans and auth user", async () => {
    await expect(deleteUserAccount(userId, mockSupabase, mockAdminSupabase)).resolves.toBeUndefined();

    expect(mockSupabase.from).toHaveBeenCalledWith("meal_plans");
    expect(mockAdminSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
  });

  it("should throw DatabaseError when meal plans deletion fails", async () => {
    const mealPlansError = { message: "Database error", code: "PGRST116" };
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: mealPlansError }),
      }),
    });

    await expect(deleteUserAccount(userId, mockSupabase, mockAdminSupabase)).rejects.toThrow(DatabaseError);
    await expect(deleteUserAccount(userId, mockSupabase, mockAdminSupabase)).rejects.toThrow(
      `Failed to delete meal plans for user ${userId}`
    );
  });

  it("should throw DatabaseError when auth user deletion fails", async () => {
    const authError = { message: "Auth deletion failed", code: "AUTH_ERROR" };
    (mockAdminSupabase.auth.admin.deleteUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: authError,
    });

    await expect(deleteUserAccount(userId, mockSupabase, mockAdminSupabase)).rejects.toThrow(DatabaseError);
    await expect(deleteUserAccount(userId, mockSupabase, mockAdminSupabase)).rejects.toThrow(
      `Failed to delete auth user ${userId}`
    );
  });
});
