export interface RequestParams {
    url: string;
    path: string;
    method: string;
    apiKey?: string;
}

export interface ApiResponse {
    statusCode: number;
    body: any;
}

export interface PlaceBidRequest {
    auctionID: string
    userID: string
    bidPrice: number
}

export const makeRequest = async <T,>(params: RequestParams, body: T): Promise<ApiResponse> => {
    const endpoint = new URL(params.url);
    const options = {
        method: params.method,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
        },
        body: body ? JSON.stringify(body) : undefined,
    };

    if (params.apiKey)
        Object.defineProperty(options.headers, 'x-api-key', { value: params.apiKey })

    try {
        const response = await fetch(`${endpoint.toString()}/${params.path}`, options);
        const data = await response.json();
        return {
            statusCode: response.status,
            body: data
        };
    } catch (error) {
        throw error;
    }
}