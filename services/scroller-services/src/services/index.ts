import dynamoDBClient from "../model";
import HourlyService from "./hourlyService"
import DailyService from "./dailyService"
import TransactionService  from "./transactionService";
import TrackingService from "./trackingService";
import WalletService from "./walletService";

export const transactionService = new TransactionService(dynamoDBClient());
export const hourlyService = new HourlyService(dynamoDBClient());
export const dailyService = new DailyService(dynamoDBClient());
export const trackingService = new TrackingService(dynamoDBClient());
export const walletService = new WalletService(dynamoDBClient());