import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tasks Client</h1>
      <p className="mb-4">Sign in to manage your tasks.</p>
      <Link href="/login" className="text-blue-600 underline">
        Go to login
      </Link>
    </main>
  );
}
