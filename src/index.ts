import Fastify from "fastify";
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const MAX_JOBS = 5;

let jobId = 1;

interface Job {
  id: number;
  message: string;
  process: string;
}

interface JobResult {
  jobId: number;
  message: string;
  runningTime: number;
}

const jobs: Job[] = [];

const runningJobs: Job[] = [];

const jobResults: JobResult[] = [];

const JobSchema = Type.Object({
  message: Type.String(),
  process: Type.String()
});

const waitForJob = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });
};

const checkJobs = async () => {
  if (jobs.length > 0 && runningJobs.length < MAX_JOBS) {
    const jobToRun = jobs.shift();

    if (!jobToRun) return;

    runJob(jobToRun);
  }
}

const queueJob = async (job: Job) => {
  jobs.push(job);

  checkJobs();
}

const addJobResult = (jobId: number, message: string, runningTime: number) => {
  jobResults.push({
    jobId,
    message,
    runningTime
  });
}

const runJob = async (job: Job) => {
  runningJobs.push(job);

  await waitForJob();

  const time = Math.random() * 1000;

  addJobResult(job.id, job.message, time);

  const runningJobIndex = runningJobs.findIndex((currentJob) => currentJob.id === job.id);
  const jobIndex = jobs.findIndex((currentJob) => currentJob.id === job.id);

  if (runningJobIndex !== -1) {
    runningJobs.splice(runningJobIndex, 1);
  }

  if (jobIndex !== -1) {
    jobs.splice(jobIndex, 1);
  }

  checkJobs();
}

const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

app.get("/health", async () => ({ status: "ok" }));

app.listen({ port: 3000 }).then(() => {
  console.log("Listening on :3000");
});

app.post('/submitJob',
  {
    schema: {
      body: JobSchema
    }
  }, async (req, res) => {
    const newJobId = jobId ++;

    const newJob = {
      id: newJobId,
      message: req.body.message,
      process: req.body.process
    };

    queueJob(newJob);

    res.status(200);
    res.send({ message: `Job added with ID ${newJobId}` });
});

app.get('/jobStatus', async (req, res) => {
  const numRunningJobs = runningJobs.length;
  const totalJobs = jobs.length + runningJobs.length;

  res.status(200);
  res.send({ message: `${numRunningJobs} are currently running out of ${totalJobs}` });
});

app.get('/jobResults', async (req, res) => {
  res.status(200);
  res.send({ results: jobResults });
});
