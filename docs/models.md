pull_requests

# Data Models (MongoDB / Mongoose style)

Below are the collections and sample Mongoose-like schema shapes. These are starting points; fields `...` are extensible.

---

## users

```js
const UserSchema = new Schema({
  githubId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  avatarUrl: String,
  role: { type: String, enum: ['admin','lead','dev','viewer'], default: 'dev' },
  orgIds: [{ type: Schema.Types.ObjectId, ref: 'Org' }],
  settings: { type: Schema.Types.Mixed },
}, { timestamps: true });

UserSchema.index({ githubId: 1 });
UserSchema.index({ orgIds: 1 });
```

---

## orgs

```js
const OrgSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  settings: {
    scoringWeights: {
      commits: Number, mergedPRs: Number, issuesClosed: Number,
      avgPRTime: Number, prSize: Number
    },
    alertThresholds: {
      prOpenHours: { type: Number, default: 72 },
      overloadScore: { type: Number, default: 3.0 }
    },
    dataRetentionDays: { type: Number, default: 90 }
  }
}, { timestamps: true });

OrgSchema.index({ slug: 1 });
```

---

## repos

```js
const RepoSchema = new Schema({
  provider: { type: String, enum: ['github','gitlab'], default: 'github' },
  providerRepoId: { type: String, required: true, unique: true },
  orgId: { type: Schema.Types.ObjectId, ref: 'Org' },
  name: String, // e.g. owner/repo
  url: String,
  defaultBranch: String,
  connectedAt: Date,
  webhookSecretHash: String,
  settings: Schema.Types.Mixed
}, { timestamps: true });

RepoSchema.index({ orgId: 1 });
RepoSchema.index({ providerRepoId: 1 });
```

---

## commits

```js
const CommitSchema = new Schema({
  sha: { type: String, required: true, unique: true },
  repoId: { type: Schema.Types.ObjectId, ref: 'Repo' },
  authorGithubId: String,
  authorName: String,
  message: String,
  timestamp: Date,
  filesChangedCount: Number,
  additions: Number,
  deletions: Number,
  modulePaths: [String],
  processed: { type: Boolean, default: false }
}, { timestamps: true });

CommitSchema.index({ repoId: 1, timestamp: -1 });
CommitSchema.index({ sha: 1 });
```

---

## pull_requests

```js
const PRSchema = new Schema({
  providerPrId: { type: String, required: true, unique: true },
  repoId: { type: Schema.Types.ObjectId, ref: 'Repo' },
  number: Number,
  title: String,
  authorGithubId: String,
  state: { type: String, enum: ['open','closed','merged','draft'] },
  createdAt: Date,
  updatedAt: Date,
  mergedAt: Date,
  closedAt: Date,
  filesChanged: Number,
  additions: Number,
  deletions: Number,
  reviewers: [{ githubId: String, respondedAt: Date }],
  commentsCount: Number,
  lastReviewAt: Date,
  riskScore: { type: Number, default: 0 },
  processed: { type: Boolean, default: false }
}, { timestamps: true });

PRSchema.index({ repoId: 1, state: 1 });
PRSchema.index({ providerPrId: 1 });
```

---

## issues

```js
const IssueSchema = new Schema({
  providerIssueId: { type: String, required: true },
  repoId: { type: Schema.Types.ObjectId, ref: 'Repo' },
  number: Number,
  title: String,
  state: { type: String, enum: ['open','closed'] },
  assigneeGithubId: String,
  createdAt: Date,
  closedAt: Date,
  labels: [String],
  commentsCount: Number
}, { timestamps: true });
```

---

## metrics_snapshots

```js
const MetricsSnapshotSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Org' },
  repoId: { type: Schema.Types.ObjectId, ref: 'Repo', default: null },
  metricName: String,
  metricValue: Number,
  timeframeStart: Date,
  timeframeEnd: Date,
  payload: Schema.Types.Mixed
}, { timestamps: true });

MetricsSnapshotSchema.index({ orgId: 1, metricName: 1, timeframeStart: -1 });
```

---

## alerts

```js
const AlertSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Org' },
  repoId: { type: Schema.Types.ObjectId, ref: 'Repo', default: null },
  type: String, // PR_STALE, OVERLOAD, HIGH_RISK_PR, BUS_FACTOR_RISK
  severity: { type: String, enum: ['low','medium','high'], default: 'medium' },
  metadata: Schema.Types.Mixed,
  createdAt: Date,
  resolvedAt: Date,
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AlertSchema.index({ orgId: 1, resolvedAt: 1 });
```

---

## Indexing & Performance Notes

- Index on `repoId`, `timestamp` for fast commit queries.
- Index `providerPrId` / `providerRepoId` for upserts from webhook.
- Consider time-series partitioning (retention) for `metrics_snapshots` if data grows.

---


