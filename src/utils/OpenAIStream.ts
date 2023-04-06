import {createParser, ParsedEvent, ReconnectInterval,} from "eventsource-parser";

export type ChatGPTAgent = "user" | "system";

export interface ChatGPTMessage {
    role: ChatGPTAgent;
    content: string;
}

export interface OpenAIStreamPayload {
    model: string;
    messages: ChatGPTMessage[];
    stream: boolean;
    n: number;
}

const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

export async function OpenAIStream(payload: OpenAIStreamPayload) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    function randomNumberInRange(min:any, max:any) {
        // 👇️ 获取 min（含）和 max（含）之间的数字
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const apikeys = apiKey?.split(",");
    const randomNumber = randomNumberInRange(0, apikeys.length - 1);
    const newapikey = apikeys[randomNumber];

    let counter = 0;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newapikey ?? ""}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    return new ReadableStream({
        async start(controller) {
            // callback
            function onParse(event: ParsedEvent | ReconnectInterval) {
                if (event.type === "event") {
                    const data = event.data;
                    // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
                    if (data === "[DONE]") {
                        controller.close();
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0].delta?.content || "";
                        if (counter < 2 && (text.match(/\n/) || []).length) {
                            // this is a prefix character (i.e., "\n\n"), do nothing
                            return;
                        }
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                        counter++;
                    } catch (e) {
                        // maybe parse error
                        controller.error(e);
                    }
                }
            }

            const parser = createParser(onParse);
            for await (const chunk of res.body as any) {
                parser.feed(decoder.decode(chunk));
            }
        },
    });
}