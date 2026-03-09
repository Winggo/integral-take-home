import { auth } from "@/auth";
import AppHeader from "@/components/AppHeader";

export default async function QueuePage() {
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
        <h1>Review Queue</h1>
        <p>Review and manage submitted intakes.</p>
      </main>
    </>
  );
}
