import { SignIn } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const user = await currentUser();

  // If user is already signed in, redirect instead of showing <SignIn/>
  if (user) {
    redirect("/onboarding"); // Change this to avoid redirect loop
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn
        afterSignInUrl="/onboarding"
       appearance={{
        elements: {
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
          card: "shadow-xl rounded-2xl border border-gray-200 ",
          headerTitle: "text-2xl font-bold text-center",
          headerSubtitle: "text-sm text-gray-500 text-center",
          footerAction: "block", 
  

        },
        layout: {
          socialButtonsPlacement: "bottom", // or "top"
          socialButtonsVariant: "blockButton", // or "iconButton"
        },
      }}
      />
    </div>
  );
}
