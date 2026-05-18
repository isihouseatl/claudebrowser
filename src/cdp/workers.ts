// src/cdp/workers.ts
import { CdpClient } from './client';

export interface WorkerInfo {
  workerId: string;
  url: string;
  type: string;
}

// 1. List all active workers (dedicated workers + service workers)
export async function getWorkerList(
  client: CdpClient,
): Promise<Array<{ workerId: string; url: string; type: string }>> {
  const { targetInfos } = await (client.raw.Target as any).getTargets();
  return (targetInfos as Array<{ targetId: string; url: string; type: string }>)
    .filter(t => t.type === 'worker' || t.type === 'service_worker')
    .map(t => ({ workerId: t.targetId, url: t.url, type: t.type }));
}

// 2. Evaluate an expression inside a specific worker context
export async function evaluateInWorker(
  client: CdpClient,
  workerId: string,
  expression: string,
): Promise<unknown> {
  const { sessionId } = await (client.raw.Target as any).attachToTarget({
    targetId: workerId,
    flatten: true,
  });
  try {
    const { result, exceptionDetails } = await (client.raw.Runtime as any).evaluate({
      expression,
      sessionId,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(
        `JS error in worker: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
      );
    }
    return result.value;
  } finally {
    await (client.raw.Target as any).detachFromTarget({ sessionId });
  }
}

// 3. Return the count of all active workers
export async function getWorkerCount(client: CdpClient): Promise<number> {
  const workers = await getWorkerList(client);
  return workers.length;
}

// 4. Terminate a worker by its target ID
export async function terminateWorker(
  client: CdpClient,
  workerId: string,
): Promise<void> {
  await (client.raw.Target as any).closeTarget({ targetId: workerId });
}

// 5. Return only dedicated workers (targetType === 'worker')
export async function getDedicatedWorkers(
  client: CdpClient,
): Promise<Array<{ workerId: string; url: string }>> {
  const { targetInfos } = await (client.raw.Target as any).getTargets();
  return (targetInfos as Array<{ targetId: string; url: string; type: string }>)
    .filter(t => t.type === 'worker')
    .map(t => ({ workerId: t.targetId, url: t.url }));
}

// 6. Find the first worker whose URL contains urlFragment, or null
export async function getWorkerByUrl(
  client: CdpClient,
  urlFragment: string,
): Promise<{ workerId: string; url: string; type: string } | null> {
  const workers = await getWorkerList(client);
  return workers.find(w => w.url.includes(urlFragment)) ?? null;
}

// 7. Poll for a worker matching urlFragment, throwing if timeoutMs elapses
export async function waitForWorker(
  client: CdpClient,
  urlFragment: string,
  timeoutMs: number = 10000,
): Promise<{ workerId: string; url: string; type: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const worker = await getWorkerByUrl(client, urlFragment);
    if (worker !== null) return worker;
    await new Promise<void>(resolve => setTimeout(resolve, 300));
  }
  throw new Error(
    `waitForWorker: no worker matching ${JSON.stringify(urlFragment)} found within ${timeoutMs}ms`,
  );
}

// 8. Post a message into a worker via evaluateInWorker
export async function postMessageToWorker(
  client: CdpClient,
  workerId: string,
  message: unknown,
): Promise<void> {
  await evaluateInWorker(
    client,
    workerId,
    `self.postMessage(${JSON.stringify(message)})`,
  );
}
