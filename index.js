'use strict';
const pulumi = require('@pulumi/pulumi');

const { Resource } = require('twilio-pulumi-provider');

const workspace = new Resource('example-workspace', {
  resource: ['taskrouter', 'workspaces'],
  attributes: {
    friendlyName: 'Workspace created with Pulumi',
  },
});

const TaskqueueEnglish = new Resource('taskqueue-english', {
  resource: ['taskrouter', { workspaces: workspace.sid }, 'taskQueues'],
  attributes: {
    targetWorkers: `languages HAS "en"`,
    friendlyName: 'English Queue',
  },
});

const TaskqueueSpanish = new Resource('taskqueue-spanish', {
  resource: ['taskrouter', { workspaces: workspace.sid }, 'taskQueues'],
  attributes: {
    targetWorkers: `languages HAS "es"`,
    friendlyName: 'Spanish Queue',
  },
});

const workerOne = new Resource('worker-one', {
  resource: ['taskrouter', { workspaces: workspace.sid }, 'workers'],
  attributes: {
    friendlyName: 'Maria',
    attributes: JSON.stringify({ languages: ['en', 'es'] }),
  },
});

const workerTwo = new Resource('worker-two', {
  resource: ['taskrouter', { workspaces: workspace.sid }, 'workers'],
  attributes: {
    friendlyName: 'Bob',
    attributes: JSON.stringify({ languages: ['en'] }),
  },
});

const WorkflowIncomingRequests = new Resource('workflow-incoming-requests', {
  resource: ['taskrouter', { workspaces: workspace.sid }, 'workflows'],
  attributes: {
    assignmentCallbackUrl: 'http://example.org',
    friendlyName: 'Incoming Customer Care Requests',
    taskReservationTimeout: 1200,
    configuration: pulumi
      .all([TaskqueueEnglish.sid, TaskqueueSpanish.sid])
      .apply(([englishTaskQueueSid, spanishTaskQueueSid]) =>
        JSON.stringify({
          task_routing: {
            filters: [
              {
                friendlyName: 'Language - Spanish',
                expression: `selected_language=='es'`,
                targets: [
                  {
                    queue: spanishTaskQueueSid,
                  },
                ],
              },
              {
                friendlyName: 'Language - English',
                targets: [
                  {
                    queue: englishTaskQueueSid,
                  },
                ],
                expression: `selected_language=='en'`,
              },
            ],
          },
        })
      ),
  },
});
