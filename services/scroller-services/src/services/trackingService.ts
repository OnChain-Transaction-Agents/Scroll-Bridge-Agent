
import { DocumentClient } from "aws-sdk/clients/dynamodb";


export default class TransactionService {

    private Tablename: string = "TrackingTable";

    constructor(private docClient: DocumentClient) { }


    async getPreviousBatch() {

        //get the last timestamp from the table
        const params = {
            TableName: this.Tablename,
            Limit: 1,
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

    //await transactionService.updateBatch(newMin, newMax)
    async updateBatch(newMin: number, newMax: number) {
            
            const params = {
                TableName: this.Tablename,
                Item: {
                    "ID": 1,
                    "MAX_TOKENS": newMax,
                    "MIN_TOKENS": newMin,
                    "TIMESTAMP": Date.now()
                }
            };
    
            try {
                const data = await this.docClient.put(params).promise();
                return data;
            } catch (err) {
                console.log(err);
                return err;
            }
    
        }
    
}
