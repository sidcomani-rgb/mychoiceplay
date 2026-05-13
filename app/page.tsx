export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <h1 className="text-3xl font-bold text-pink-500">
          MCP
        </h1>

        <div className="flex gap-4">
          <button className="bg-pink-500 px-5 py-2 rounded-full font-semibold hover:bg-pink-600">
            Login
          </button>

          <button className="border border-pink-500 px-5 py-2 rounded-full hover:bg-pink-500">
            Register
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center text-center py-28 px-6">

        <h1 className="text-6xl md:text-7xl font-bold leading-tight">
          MY CHOICE PLAY OFFICIAL
        </h1>

        <p className="text-zinc-400 text-xl mt-6 max-w-2xl">
          Predict the color. Play every 5 minutes. Win instantly.
        </p>

        <div className="flex gap-5 mt-10">
          <button className="bg-pink-500 px-8 py-4 rounded-full text-lg font-bold hover:bg-pink-600 transition">
            PLAY NOW
          </button>

          <button className="border border-zinc-600 px-8 py-4 rounded-full text-lg hover:bg-zinc-900">
            WATCH LIVE
          </button>
        </div>

      </section>

      {/* GAME SECTION */}
      <section className="flex flex-col items-center justify-center py-20">

        <h2 className="text-4xl font-bold mb-10">
          LIVE COLOR GAME
        </h2>

        <div className="flex gap-10">

          <div className="w-28 h-28 rounded-full bg-red-500 shadow-[0_0_40px_red] animate-pulse"></div>

          <div className="w-28 h-28 rounded-full bg-green-500 shadow-[0_0_40px_lime] animate-pulse"></div>

          <div className="w-28 h-28 rounded-full bg-pink-500 shadow-[0_0_40px_pink] animate-pulse"></div>

        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-400 text-lg">
            Next Round Starts In
          </p>

          <h1 className="text-6xl font-bold mt-3 text-pink-500">
            04:59
          </h1>
        </div>

      </section>

      {/* BET CARDS */}
      <section className="grid md:grid-cols-3 gap-8 px-8 py-20">

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-8 text-center">
          <h2 className="text-3xl font-bold text-red-500">RED</h2>
          <p className="mt-4 text-zinc-400">Users: 124</p>
          <p className="text-2xl mt-2 font-bold">₹12,430</p>

          <button className="mt-6 bg-red-500 px-6 py-3 rounded-full font-bold hover:bg-red-600">
            BET NOW
          </button>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-8 text-center">
          <h2 className="text-3xl font-bold text-green-500">GREEN</h2>
          <p className="mt-4 text-zinc-400">Users: 93</p>
          <p className="text-2xl mt-2 font-bold">₹9,120</p>

          <button className="mt-6 bg-green-500 px-6 py-3 rounded-full font-bold hover:bg-green-600">
            BET NOW
          </button>
        </div>

        <div className="bg-zinc-900 border border-pink-500 rounded-3xl p-8 text-center">
          <h2 className="text-3xl font-bold text-pink-500">PINK</h2>
          <p className="mt-4 text-zinc-400">Users: 64</p>
          <p className="text-2xl mt-2 font-bold">₹5,870</p>

          <button className="mt-6 bg-pink-500 px-6 py-3 rounded-full font-bold hover:bg-pink-600">
            BET NOW
          </button>
        </div>

      </section>

      {/* WALLET */}
      <section className="px-8 py-20">

        <div className="bg-zinc-900 rounded-3xl p-10 border border-zinc-700 max-w-3xl mx-auto text-center">

          <h2 className="text-4xl font-bold">
            WALLET BALANCE
          </h2>

          <h1 className="text-6xl font-bold text-green-500 mt-6">
            ₹2,540
          </h1>

          <div className="flex justify-center gap-5 mt-10">

            <button className="bg-green-500 px-8 py-4 rounded-full text-lg font-bold hover:bg-green-600">
              ADD MONEY
            </button>

            <button className="bg-pink-500 px-8 py-4 rounded-full text-lg font-bold hover:bg-pink-600">
              WITHDRAW
            </button>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-10 text-center text-zinc-500">
        © 2026 MY CHOICE PLAY OFFICIAL — All Rights Reserved
      </footer>

    </main>
  );
}