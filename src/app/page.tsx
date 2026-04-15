export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Norsk Nyhetsagent
        </h1>
        <p className="text-gray-500 mb-8">
          Lær norsk gjennom aktuelle nyheter
        </p>
        <a
          href="/results"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Hent dagens nyheter
        </a>
      </div>
    </main>
  );
}
