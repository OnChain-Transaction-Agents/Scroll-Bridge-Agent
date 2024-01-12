import { DocumentClient } from "aws-sdk/clients/dynamodb";


export default class DailyService {

    private Tablename: string = "historicalCSV";

    constructor(private docClient: DocumentClient) { }


    //dailyService.getFullDay()

    


    async createDailyAverage(gasPriceGwei: number) {
        //get current timestamp 
        const timestamp = new Date().getTime();
        //get table count
        const dayCount = await this.getAverageCount()
        const newDay = dayCount + 1
        console.log('newDay', newDay)
        const params = {
            TableName: this.Tablename,
            Item: {
                DATE: new Date().toISOString().slice(0, 10),
                Day: newDay,
                TIMESTAMP: timestamp,
                Value_Wei: gasPriceGwei,
                Value_Gwei: gasPriceGwei / 1000000000,
            }
        }
        console.log('params', params)
        try {
            await this.docClient.put(params).promise();
            console.log('success')
        } catch (err) {
            console.log(err);
            return false;
        }
        return true;
    }

    async getAverageCount() {
        //get a count of all items 
        const params = {
            TableName: this.Tablename,
            Select: "COUNT"
        };
        try {
            const data = await this.docClient.scan(params).promise();
            console.log('data', data)
            return data.Count;
        } catch (err) {
            console.log(err);
            return 0;
        }
    }




    async getDailyAverages() {
        //get the last 10 days of data
        const params = {
            TableName: this.Tablename,
            Limit: 10,
            ScanIndexForward: false
        };
        try {
            const data = await this.docClient.scan(params).promise();
            return data.Items;
        } catch (err) {
            console.log(err);
            return [];
        }
    }

    async getDailyAverage(day: number) {
        
        const params = {
            TableName: this.Tablename,
            KeyConditionExpression: "#day = :day",
            ExpressionAttributeNames: {
                "#day": "Day"
            },
            ExpressionAttributeValues: {
                ":day": day
            }
        };
        try {
            const data = await this.docClient.query(params).promise();
            return data.Items;
        } catch (err) {
            console.log(err);
            return [];
        }
    }
}
