import { auth } from "@/auth";
import { SignUpCard } from "@/features/auth/components/sign-up-card";
import { redirect } from "next/navigation";

const SignUpPage = async () => {
	const session = await auth();

	if (session) {
		redirect("/");
	}

	return <SignUpCard />;
};

export default SignUpPage;
