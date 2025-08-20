import { SignUp } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const user = await currentUser();

  // If user is already signed in, redirect them
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp afterSignUpUrl="/onboarding" />
    </div>
  );
}
