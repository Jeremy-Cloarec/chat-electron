import { MessageType } from "./MessageType";

export type ConversationType = {
    id: number;
    title: string;
    lastMessage: MessageType;
};
