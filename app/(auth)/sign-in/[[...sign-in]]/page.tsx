import { SignIn } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
const user=await currentUser();

  // If user is already signed in, redirect instead of showing <SignIn/>
  if (user) {
    redirect("/"); // 👈 change to dashboard or /onboarding if you prefer
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn afterSignInUrl="/onboarding" />
    </div>
  );
}
