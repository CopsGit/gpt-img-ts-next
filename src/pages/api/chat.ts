import {OpenAIStream, OpenAIStreamPayload} from "@/utils/OpenAIStream";

export const config = {
    runtime: "edge",
};

const handler = async (req: Request): Promise<Response> => {
        const { prompt } = (await req.json()) as {
            prompt: string;
        };

        const payload: OpenAIStreamPayload = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `${prompt}`,
                },
            ],
            stream: true,
            n: 1,
        }

    const stream = await OpenAIStream(payload);
    return new Response(stream);
};

export default handler;