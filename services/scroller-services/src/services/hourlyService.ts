import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { dailyService } from ".";


export default class HourlyService {

    private Tablename: string = "HourlyHistoricalTable";

    constructor(private docClient: DocumentClient) { }


    async createHourlyRate(gasPriceGwei: number) {
        //get current timestamp 
        const timestamp = new Date().getTime();
        const day = await dailyService.getAverageCount()
        const hour = new Date().getHours();
        const params = {
            TableName: this.Tablename,
            Item: {
                DATE: new Date().toISOString().slice(0, 10),
                TIMESTAMP: timestamp,
                DAY: day,
                Value_Wei: gasPriceGwei * 1000000000,
                Value_Gwei: gasPriceGwei,
                HOUR: hour
            }
        };
        try {
            await this.docClient.put(params).promise();
        } catch (err) {
            console.log(err);
            return false;
        }
        return true;
    }

    async getFullDay() {
        //get object that has 23 in HOUR
        const params = {
            TableName: this.Tablename,
            FilterExpression: "#hour = :hour AND attribute_not_exists(isRecorded)",
            ExpressionAttributeNames: {
                "#hour": "HOUR"
            },
            ExpressionAttributeValues: {
                ":hour": 23
            }
        }
        try {
            const data = await this.docClient.scan(params).promise();
            return data.Items;
        } catch (err) {
            console.log(err);
            return [];
        }
    }

    //get all objects with same DATE
    async getHourlyRates(date: string): Promise<any> {
        const params = {
            TableName: this.Tablename,
            FilterExpression: "#dateHist = :date",
            ExpressionAttributeNames: {
                "#dateHist": "DATE"
            },
            ExpressionAttributeValues: {
                ":date": date
            }
        }
        try {
            console.log('params', params)
            const data = await this.docClient.scan(params).promise();
            console.log('data', data)
            return data.Items;
        } catch (err) {
            console.log(err);
            return [];
        }

    }


    //const lastSix = await hourlyService.getLastSix()
    async getLastSix(): Promise<any> {
        const params = {
            TableName: this.Tablename
            // No ScanIndexForward since it's not applicable here.
        };
        
        try {
            let scanResults = await this.docClient.scan(params).promise();
            let allItems = scanResults.Items;

            // Sort the results in descending order by Timestamp (most recent first)
            const sortedByTimestamp = allItems.sort((a, b) => b.TIMESTAMP - a.TIMESTAMP);
    
            // Get the latest 6 items
            const latestSix = sortedByTimestamp.slice(0, 6);
            return latestSix;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    //await hourlyService.updateHourlyRates(hourlyRates)
    async updateHourlyRates(hourlyRates: any) {
        for (let i = 0; i < hourlyRates.length; i++) {
            const params = {
                TableName: this.Tablename,
                Key: {
                    "TIMESTAMP": hourlyRates[i].TIMESTAMP,
                },
                UpdateExpression: "set isRecorded = :r",
                ExpressionAttributeValues: {
                    ":r": true
                },
                ReturnValues: "UPDATED_NEW"
            };
            try {
                await this.docClient.update(params).promise();
            } catch (err) {
                console.log(err);
                return false;
            }
        }
        return true;
    }
}
