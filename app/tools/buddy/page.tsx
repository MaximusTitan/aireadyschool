// ./app/page.tsx
import ClientComponent from "./components/ClientComponents";
import { fetchAccessToken } from "hume";

export default async function Page() {
  try {
    const accessToken = await fetchAccessToken({
      apiKey: String(process.env.HUME_API_KEY),
      secretKey: String(process.env.HUME_SECRET_KEY),
    });

    if (!accessToken) {
      return (
        <div>Failed to initialize voice assistant. Please try again later.</div>
      );
    }

    return <ClientComponent accessToken={accessToken} />;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return (
      <div>
        An error occurred while initializing the voice assistant. Please try
        again later.
      </div>
    );
  }
}
