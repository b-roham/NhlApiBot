export const name = "ping";
export const description = "Ping!";
export async function execute(message, args) {
    console.log(message, args);
    message.channel.send("Pong!");
}