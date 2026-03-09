import { auth } from "@/auth";
import AppHeader from "@/components/AppHeader";

export default async function IntakePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <>
      <AppHeader
        userName={user.name}
        userRole={user.role}
        organization={user.organization}
      />
      <main style={{ padding: "2rem" }}>
        <h1>Submit Intake</h1>
        <p>Use this form to submit a new intake for review.</p>
      </main>
    </>
  );
}
