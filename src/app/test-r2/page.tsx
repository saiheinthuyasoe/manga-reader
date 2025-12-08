"use client";

export default function TestR2Page() {
  const testUrl =
    "https://pub-ce27b8af752c4ae98c3ec5e2d5a66454.r2.dev/manga-covers/Solo_Leveling_Volume_1_Cover.jpg";

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">R2 Image Test</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Test URL:</h2>
          <a
            href={testUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 break-all"
          >
            {testUrl}
          </a>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Using regular img tag:</h2>
          <img
            src={testUrl}
            alt="Test"
            className="w-64 border border-white"
            onError={(e) => {
              console.error("IMG tag failed to load");
              e.currentTarget.style.border = "2px solid red";
            }}
            onLoad={() => {
              console.log("IMG tag loaded successfully");
            }}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Direct fetch test:</h2>
          <button
            onClick={async () => {
              try {
                const response = await fetch(testUrl);
                console.log("Fetch response:", {
                  status: response.status,
                  statusText: response.statusText,
                  headers: Object.fromEntries(response.headers.entries()),
                });
                alert(
                  `Fetch status: ${response.status} ${response.statusText}`
                );
              } catch (error) {
                console.error("Fetch error:", error);
                alert(`Fetch error: ${error}`);
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Test Fetch
          </button>
        </div>
      </div>
    </div>
  );
}
