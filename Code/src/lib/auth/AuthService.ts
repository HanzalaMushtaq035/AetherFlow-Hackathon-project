import { createClient } from "@/lib/supabase/client";
import { UserRole } from "./roles";

export interface SignupData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;

  role: UserRole;

  category?: string;
  location?: string;

  city?: string;
  service_area?: string;

  working_hours_start?: string;
  working_hours_end?: string;

  specialization?: string;

  experience_years?: number;

  service_radius_km?: number;
}

const formatError = (err: any) => {
  if (!err) {
    return new Error(
      "Unknown error occurred"
    );
  }

  const msg =
    err.message ||
    String(err);

  if (
    msg.includes(
      "row-level security"
    )
  ) {
    return new Error(
      "Database policy issue: Profile creation restricted."
    );
  }

  if (
    msg.includes(
      "already registered"
    ) ||
    msg.includes(
      "already exists"
    )
  ) {
    return new Error(
      "Email already exists."
    );
  }

  if (
    msg.includes(
      "weak"
    ) &&
    msg.includes(
      "password"
    )
  ) {
    return new Error(
      "Weak password. Please use stronger password."
    );
  }

  if (
    msg.includes(
      "Invalid login"
    )
  ) {
    return new Error(
      "Invalid credentials."
    );
  }

  if (
    msg.includes(
      "fetch"
    ) ||
    msg.includes(
      "Network"
    )
  ) {
    return new Error(
      "Network error."
    );
  }

  return new Error(msg);
};

export const AuthService = {
  async signup(
    data: SignupData
  ) {
    const supabase =
      createClient();

    try {
      const {
        data: authData,

        error:
        authError,
      } =
        await supabase.auth.signUp(
          {
            email:
              data.email,

            password:
              data.password ||
              "TempPassword123!",

            options: {
              data: {
                full_name:
                  data.fullName,

                role:
                  data.role,
              },
            },
          }
        );

      if (
        authError
      ) {
        throw authError;
      }

      if (
        authData.user
      ) {
        const {
          error:
          profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .upsert({
              id:
                authData
                  .user
                  .id,

              role:
                data.role,

              full_name:
                data.fullName,

              phone:
                data.phone,
            });

        if (
          profileError
        ) {
          console.error(
            "Profile insert error:",
            profileError
          );

          throw profileError;
        }

        if (
          data.role ===
          "technician"
        ) {
          const {
            error:
            providerError,
          } =
            await supabase
              .from(
                "providers"
              )
              .upsert({
                user_id:
                  authData
                    .user
                    .id,

                category:
                  data.category ||
                  "general",

                location:
                  data.location ||
                  "unknown",

                availability:
                  "available",

                rating: 5,

                city:
                  data.city ||
                  "unknown",

                service_area:
                  data.service_area ||
                  "all",

                working_hours_start:
                  data.working_hours_start ||
                  "09:00",

                working_hours_end:
                  data.working_hours_end ||
                  "18:00",

                specialization:
                  data.specialization ||
                  "General",

                experience_years:
                  data.experience_years ||
                  0,

                service_radius_km:
                  data.service_radius_km ||
                  10,

                verification_status:
                  "pending",

                completed_jobs: 0,
              });

          if (
            providerError
          ) {
            console.error(
              "Provider insert error:",
              providerError
            );

            throw providerError;
          }
        }
      }

      return authData;
    } catch (
    err: any
    ) {
      console.error(
        "Signup failed:",
        err
      );

      throw formatError(
        err
      );
    }
  },

  async login(
    email: string,

    password?: string
  ) {
    const supabase =
      createClient();

    try {
      const {
        data,

        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,

            password:
              password ||
              "TempPassword123!",
          }
        );

      if (
        error
      ) {
        throw error;
      }

      if (
        data.user
      ) {
        const {
          data:
          profile,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "role"
            )
            .eq(
              "id",

              data.user.id
            )
            .maybeSingle();

        return {
          ...data,

          role:
            profile?.role as UserRole,
        };
      }

      return data;
    } catch (
    err: any
    ) {
      console.error(
        "Login failed:",
        err
      );

      throw formatError(
        err
      );
    }
  },

  async logout() {
    const supabase =
      createClient();

    const {
      error,
    } =
      await supabase.auth.signOut();

    if (
      error
    ) {
      throw error;
    }
  },

  async getSession() {
    const supabase = createClient();
    try {
      // 1. Get the session locally
      const { data: { session }, error: sError } = await supabase.auth.getSession();
      if (sError || !session) {
        return { session: null, role: null };
      }

      // 2. Validate the JWT token against the Supabase backend server
      const { data: { user }, error: uError } = await supabase.auth.getUser();
      if (uError || !user) {
        // Token is invalid/expired and could not be refreshed
        return { session: null, role: null };
      }

      // 3. Verify that the profile and role exist in public.profiles
      const { data: profile, error: pError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (pError || !profile) {
        return { session: null, role: null };
      }

      return {
        session,
        role: profile.role as UserRole,
      };
    } catch (e) {
      console.error("AuthService getSession exception:", e);
      return { session: null, role: null };
    }
  },

  async loginWithGoogle() {
    const supabase = createClient();
    try {
      // Determine correct redirect URL based on environment (NextJS web vs native Capacitor APK)
      let redirectTo = `${window.location.origin}/auth/callback`;
      
      // Fallback redirection logic for native/WebView environments
      if (typeof window !== "undefined" && ((window as any).Capacitor || navigator.userAgent.includes("Capacitor"))) {
        redirectTo = "aetherflow://auth/callback";
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error("Google login failed inside AuthService:", err);
      throw formatError(err);
    }
  },
};