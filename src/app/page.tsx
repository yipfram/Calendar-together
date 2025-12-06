import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 font-sans text-zinc-900">
      {/* Hero Section */}
      <main className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Calendar Together
        </h1>
        <p className="mb-10 text-lg text-zinc-600">
          Trouvez le moment parfait pour vous retrouver.
        </p>

        {/* Benefits */}
        <ul className="mb-10 flex w-full flex-col gap-4 text-left">
          <li className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 shadow-sm">
            <span className="text-2xl">🗓️</span>
            <span className="text-base font-medium">
              Planifiez une sortie avec vos potes rapidement
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 shadow-sm">
            <span className="text-2xl">📅</span>
            <span className="text-base font-medium">
              Ajouter à votre calendrier
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 shadow-sm">
            <span className="text-2xl">✨</span>
            <span className="text-base font-medium">Et hop</span>
          </li>
        </ul>

        {/* CTA Button */}
        <Link
          href="/sign-in"
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-lg font-semibold text-white shadow-md transition-transform hover:scale-105 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 sm:w-auto"
        >
          Commencer
        </Link>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-sm text-zinc-400">
        © {new Date().getFullYear()} Calendar Together
      </footer>
    </div>
  );
}
