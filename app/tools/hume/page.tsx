import { getHumeAccessToken } from "./utils/getHumeAccessToken";
import ChatWrapper from "./components/ChatWrapper";

export default async function Page() {
  const accessToken = await getHumeAccessToken();

  if (!accessToken) {
    throw new Error();
  }

  return (
    <div className={"grow flex flex-col"}>
      <ChatWrapper accessToken={accessToken} />
    </div>
  );
}
