import dotenv from "dotenv";
import { techBot } from "./techbot";

// Load environment variables
dotenv.config();

const main = async (): Promise<void> => {
	try {
		console.log("🤖 TechBot starting up...\n");

		await techBot.run();
	} catch (error) {
		console.error("❌ Error running TechBot:", error);
		process.exit(1);
	}
};

main();
