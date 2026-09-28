// 학생이 제출한 파이썬 코드를 메인 화면과 분리된 백그라운드 스레드(Worker)에서 실행합니다.
// 이렇게 분리해두면 무한 루프에 걸린 코드가 있어도 이 워커만 강제 종료(terminate)하면 되고,
// 사이트 화면 자체는 멈추지 않습니다.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodideReadyPromise = loadPyodide();

self.onmessage = async (event) => {
  const { code } = event.data;

  try {
    const pyodide = await pyodideReadyPromise;
    pyodide.globals.set("__student_code__", code);

    // 학생 코드의 print() 출력만 정확히 캡처하기 위해 표준출력을 임시로 문자열 버퍼로 바꿔치기 합니다.
    const harness = `
import sys, io
__old_stdout = sys.stdout
sys.stdout = io.StringIO()
__error = None
try:
    exec(__student_code__, {})
except Exception as e:
    __error = str(e)
__output = sys.stdout.getvalue()
sys.stdout = __old_stdout
(__output, __error)
`;
    const result = await pyodide.runPythonAsync(harness);
    const [output, error] = result.toJs();
    self.postMessage({ type: "done", output: output ?? "", error: error ?? null });
  } catch (err) {
    self.postMessage({ type: "error", error: String(err) });
  }
};
