import { createWriteStream } from "fs";
import { format } from "util";
import { network } from "hardhat";

function _normalizeOp(op: any) {
    if (op.op === "STATICCALL") {
        if (
            op.stack.length > 8 &&
            op.stack[op.stack.length - 8] ===
                "0000000000000000000000000000000000000000000000000000000000000001"
        ) {
            op.gasCost = 700 + 3000;
            op.op = "STATICCALL-ECRECOVER";
        } else if (
            op.stack.length > 8 &&
            op.stack[op.stack.length - 8] <=
                "00000000000000000000000000000000000000000000000000000000000000FF"
        ) {
            op.gasCost = 700;
            op.op = "STATICCALL-" + op.stack[op.stack.length - 8].substr(62, 2);
        } else {
            op.gasCost = 700;
        }
    }
    if (["CALL", "DELEGATECALL", "CALLCODE"].indexOf(op.op) != -1) {
        op.gasCost = 700;
    }
    if (["RETURN", "REVERT", "INVALID"].indexOf(op.op) != -1) {
        op.gasCost = 3;
    }
}

function log(d: Object, logFile: any, logStdOut: any) {
    logFile.write(format(d) + "\n");
    logStdOut.write(format(d) + "\n");
};

export async function profileEVM(
    txHash: string,
    instruction: string | Array<string>
) {
    const trace = await network.provider.send("debug_traceTransaction", [
        txHash,
    ]);
    var logFile = createWriteStream(__dirname + "/debug.log", {flags : 'w'});
    var logStdOut = process.stdout;
    log(trace, logFile, logStdOut);

    const str = "";
    if (Array.isArray(instruction)) {
        return instruction.map((instr) => {
            return str.split('"' + instr.toUpperCase() + '"').length - 1;
        });
    }
    return str.split('"' + instruction.toUpperCase() + '"').length - 1;
}

export async function gasspectEVM(txHash: string) {
    const trace = await network.provider.send("debug_traceTransaction", [
        txHash,
    ]);

    let ops = trace.result.structLogs;
    let trace_address = [0, -1];
    for (let op of ops) {
        op.trace_address = trace_address.slice(0, trace_address.length - 1);
        _normalizeOp(op);

        if (op.depth + 2 > trace_address.length) {
            trace_address[trace_address.length - 1] += 1;
            trace_address.push(-1);
        }

        if (op.depth + 2 < trace_address.length) {
            trace_address.pop();
        }
    }
    console.log(
        ops
            .filter((op: any) => op.gasCost > 300)
            .map(
                (op: any) =>
                    op.trace_address.join("-") +
                    "-" +
                    op.op +
                    " = " +
                    op.gasCost
            )
    );
}
