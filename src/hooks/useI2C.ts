import type {
  I2CBlockLength,
  I2CByte,
  I2CReadByteResponse,
  I2CReadBlockResponse,
  I2CReadRegisterResponse,
  I2CResponse,
  I2CScanResponse,
  I2CWriteBlockResponse,
  I2CWriteByteResponse,
  I2CWriteRegisterResponse,
  WebSocketMessage,
} from "../ws/protocol";
import { useWebSocketContext } from "../context/WebSocketContext";
import { useCookie } from "./useCookie";

export type I2CConfiguration = {
  address: string;
  register: string;
  value: string;
  length: string;
  data: string;
};

const defaultConfiguration: I2CConfiguration = {
  address: "72",
  register: "0",
  value: "0",
  length: "8",
  data: "1, 2, 3, 4",
};

function isI2CResponse(message: WebSocketMessage): message is I2CResponse {
  return "type" in message && message.type === "i2c" && "ok" in message;
}

function latestResponse<T extends I2CResponse>(
  messages: WebSocketMessage[],
  action: T["action"],
): T | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (isI2CResponse(message) && message.action === action) {
      return message as T;
    }
  }
  return undefined;
}

export function useI2C() {
  const { messages, status, sendMessage } = useWebSocketContext();
  const [configuration, setConfiguration] = useCookie(
    "i2c-configuration",
    defaultConfiguration,
  );

  function updateConfiguration(next: Partial<I2CConfiguration>) {
    setConfiguration((current) => ({ ...current, ...next }));
  }

  function scan() {
    return sendMessage({ type: "i2c", action: "scan" });
  }

  function readRegister(address: number, register: number) {
    return sendMessage({ type: "i2c", action: "read_register", address, register });
  }

  function readByte(address: number) {
    return sendMessage({ type: "i2c", action: "read_byte", address });
  }

  function writeByte(address: number, value: I2CByte) {
    return sendMessage({ type: "i2c", action: "write_byte", address, value });
  }

  function writeRegister(address: number, register: number, value: I2CByte) {
    return sendMessage({
      type: "i2c",
      action: "write_register",
      address,
      register,
      value,
    });
  }

  function readBlock(address: number, register: number, length: I2CBlockLength) {
    return sendMessage({
      type: "i2c",
      action: "read_block",
      address,
      register,
      length,
    });
  }

  function writeBlock(address: number, register: number, data: I2CByte[]) {
    return sendMessage({
      type: "i2c",
      action: "write_block",
      address,
      register,
      data,
    });
  }

  return {
    isConnected: status === "Connected",
    configuration,
    updateConfiguration,
    scan,
    readByte,
    writeByte,
    readRegister,
    writeRegister,
    readBlock,
    writeBlock,
    scanResponse: latestResponse<I2CScanResponse>(messages, "scan"),
    readByteResponse: latestResponse<I2CReadByteResponse>(messages, "read_byte"),
    writeByteResponse: latestResponse<I2CWriteByteResponse>(messages, "write_byte"),
    readRegisterResponse: latestResponse<I2CReadRegisterResponse>(
      messages,
      "read_register",
    ),
    writeRegisterResponse: latestResponse<I2CWriteRegisterResponse>(
      messages,
      "write_register",
    ),
    readBlockResponse: latestResponse<I2CReadBlockResponse>(
      messages,
      "read_block",
    ),
    writeBlockResponse: latestResponse<I2CWriteBlockResponse>(
      messages,
      "write_block",
    ),
  };
}