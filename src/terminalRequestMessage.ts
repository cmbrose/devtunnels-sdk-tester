import {
    ChannelRequestMessage,
    ChannelRequestType,
    SshDataReader,
    SshDataWriter,
  } from "@microsoft/dev-tunnels-ssh";
  
  // Translated from https://github.com/microsoft/dev-tunnels-ssh/blob/main/src/cs/Ssh/Messages/Connection/TerminalRequestMessage.cs
  export enum TerminalOpcode {
    TTY_OP_END = 0, // TTY_OP_END  Indicates end of options.
    VINTR = 1, // Interrupt character; 255 if none.
    VQUIT = 2, // The quit character (sends SIGQUIT signal on POSIX systems).
    VERASE = 3, // Erase the character to left of the cursor.
    VKILL = 4, // Kill the current input line.
    VEOF = 5, // End-of-file character (sends EOF from the terminal).
    VEOL = 6, // End-of-line character in addition to carriage return and/or linefeed.
    VEOL2 = 7, // Additional end-of-line character.
    VSTART = 8, // Continues paused output (normally control-Q).
    VSTOP = 9, // Pauses output(normally control-S).
    VSUSP = 10, // Suspends the current program.
    VDSUSP = 11, // Another suspend character.
    VREPRINT = 12, // Reprints the current input line.
    VWERASE = 13, // Erases a word left of cursor.
    VLNEXT = 14, // Enter the next character typed literally, even if a special character.
    VFLUSH = 15, // Character to flush output.
    VSWTCH = 16, // Switch to a different shell layer.
    VSTATUS = 17, // Prints system status line (load, command, pid, etc).
    VDISCARD = 18, // Toggles the flushing of terminal output.
    IGNPAR = 30, // Ignore parity.
    PARMRK = 31, // Mark parity and framing errors.
    INPCK = 32, // Enable checking of parity errors.
    ISTRIP = 33, // Strip 8th bit off characters.
    INLCR = 34, // Map NL into CR on input.
    IGNCR = 35, // Ignore CR on input.
    ICRNL = 36, // Map CR to NL on input.
    IUCLC = 37, // Translate uppercase characters to lowercase.
    IXON = 38, // Enable output flow control.
    IXANY = 39, // Any char will restart after stop.
    IXOFF = 40, // Enable input flow control.
    IMAXBEL = 41, // Ring bell on input queue full.
    ISIG = 50, // Enable signals INTR, QUIT, [D]SUSP.
    ICANON = 51, // Canonicalize input lines.
    XCASE = 52, // Enable I/O of upper chars by preceding lower with "\".
    ECHO = 53, // Enable echoing.
    ECHOE = 54, // Visually erase chars.
    ECHOK = 55, // Kill character discards current line.
    ECHONL = 56, // Echo NL even if ECHO is off.
    NOFLSH = 57, // Don't flush after interrupt.
    TOSTOP = 58, // Stop background jobs from output.
    IEXTEN = 59, // Enable extensions.
    ECHOCTL = 60, // Echo control characters as ^(Char).
    ECHOKE = 61, // Visual erase for line kill.
    PENDIN = 62, // Retype pending input.
    OPOST = 70, // Enable output processing.
    OLCUC = 71, // Convert lowercase to uppercase.
    ONLCR = 72, // Map NL to CR-NL.
    OCRNL = 73, // Translate carriage return to newline (output).
    ONOCR = 74, // Translate newline to carriage return-newline (output).
    ONLRET = 75, // Newline performs a carriage return (output).
    CS7 = 90, // 7 bit mode.
    CS8 = 91, // 8 bit mode.
    PARENB = 92, // Parity enable.
    PARODD = 93, // Odd parity, else even.
    TTY_OP_ISPEED = 128, // Specifies the input baud rate in bits per second.
    TTY_OP_OSPEED = 129,
  }
  
  export interface TerminalMode {
    opcode: TerminalOpcode;
    argument: number;
  }
  
  export class TerminalRequestMessage extends ChannelRequestMessage {
    term: string;
    columns: number;
    rows: number;
    pixelWidth: number;
    pixelHeight: number;
    terminalModes: TerminalMode[];
  
    public wantReply: boolean = true;
  
    public constructor(
        term?: string,
        columns?: number,
        rows?: number,
        pixelWidth?: number,
        pixelHeight?: number,
        terminalModes?: TerminalMode[]
    ) {
        super();
        this.requestType = ChannelRequestType.terminal;
        this.term = term ?? "";
        this.columns = columns ?? 0;
        this.rows = rows ?? 0;
        this.pixelWidth = pixelWidth ?? 0;
        this.pixelHeight = pixelHeight ?? 0;
        this.terminalModes = terminalModes ?? [];
    }
  
    protected onRead(reader: SshDataReader): void {
      super.onRead(reader);
      this.term = reader.readString("ascii");
      this.columns = reader.readUInt32();
      this.rows = reader.readUInt32();
      this.pixelWidth = reader.readUInt32();
      this.pixelHeight = reader.readUInt32();
  
      this.terminalModes = [];
  
      const binaryData = reader.readBinary();
      
      const binaryReader = new SshDataReader(binaryData);
      while (binaryReader.available > 0) {
        const opcode = binaryReader.readByte() as TerminalOpcode;
  
        if (opcode === TerminalOpcode.TTY_OP_END) {
          break;
        }
  
        this.terminalModes.push({
          opcode: opcode,
          argument: binaryReader.readUInt32(),
        });
      }
    }
  
    protected onWrite(writer: SshDataWriter): void {
      super.onWrite(writer);
      writer.writeString(this.term, "ascii");
      writer.writeUInt32(this.columns);
      writer.writeUInt32(this.rows);
      writer.writeUInt32(this.pixelWidth);
      writer.writeUInt32(this.pixelHeight);
      //Each UInt32 takes 4 bytes + 1 byte for opcode, if you have n terminal modes, you'll need a buffer of size 5n + 1 bytes.
      let bufferSize = (this.terminalModes.length * 5) + 1;
      let modesWriter = new SshDataWriter(Buffer.alloc(bufferSize));
  
      for (let terminalMode of this.terminalModes) {
        modesWriter.writeByte(terminalMode.opcode as number);
        modesWriter.writeUInt32(terminalMode.argument);
      }
  
      modesWriter.writeByte(TerminalOpcode.TTY_OP_END as number);
  
      writer.writeBinary(modesWriter.toBuffer());
    }
  
    public toString(): string {
      return `${super.toString()} (requestType=${this.requestType})`;
    }
  }
  