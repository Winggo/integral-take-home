import { auth } from "@/auth";
import AppHeader from "@/components/AppHeader";
import IntakeForm from "@/components/IntakeForm";
import styles from "./page.module.css";

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
      <main className={styles.main}>
        <IntakeForm defaultName={user.name} defaultEmail={user.email} />
      </main>
    </>
  );
}
