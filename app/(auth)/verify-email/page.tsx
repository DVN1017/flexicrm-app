/**
 * Email verification route for the authentication module.
 * It presents post-signup verification guidance without implementing resend functionality.
 */
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";

export default function VerifyEmailPage() {
  return <VerifyEmailCard />;
}
