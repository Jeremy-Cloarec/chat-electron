export type MessageType = {
    id: number;
    type: string;
    content: string;
    conversation_id: number | string;
    author: string;
    user_id: number;
};