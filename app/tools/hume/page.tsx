import { getHumeAccessToken } from "./utils/getHumeAccessToken";
import ChatWrapper from "./components/ChatWrapper";

export default async function Page() {
  try {
    const accessToken = await getHumeAccessToken();

    if (!accessToken) {
      return (
        <div className="grow flex flex-col items-center justify-center">
          <p className="text-red-500">
            Failed to initialize Hume API. Please check your configuration.
          </p>
        </div>
      );
    }

    return (
      <div className={"grow flex flex-col"}>
        <ChatWrapper accessToken={accessToken} />
      </div>
    );
  } catch (error) {
    return (
      <div className="grow flex flex-col items-center justify-center">
        <p className="text-red-500">
          An error occurred while loading the page: {(error as Error).message}
        </p>
      </div>
    );
  }
}
