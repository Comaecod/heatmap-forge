const https = require("https");

const API = "api.github.com";

class GitHubClient {
  constructor({ token, repo, authorName, authorEmail }) {
    this.token = token;
    this.repo = repo;
    this.author = { name: authorName, email: authorEmail };
  }

  request(method, pathname, body) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const options = {
        hostname: API,
        path: pathname,
        method,
        headers: {
          Authorization: `token ${this.token}`,
          "User-Agent": "git-activity-maker",
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "Content-Length": payload ? Buffer.byteLength(payload) : 0,
        },
      };
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json;
          try {
            json = JSON.parse(data);
          } catch {
            json = data;
          }
          if (res.statusCode >= 400) {
            reject(new Error(`GitHub API ${res.statusCode}: ${JSON.stringify(json)}`));
          } else {
            resolve(json);
          }
        });
      });
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  async getDefaultBranch() {
    const info = await this.request("GET", `/repos/${this.repo}`);
    return info.default_branch;
  }

  async getHeadSha(branch) {
    const ref = await this.request("GET", `/repos/${this.repo}/git/ref/heads/${branch}`);
    return ref.object.sha;
  }

  // Returns { content, path, size } or null when there is no README.
  async getReadme(branch) {
    try {
      const info = await this.request(
        "GET",
        `/repos/${this.repo}/contents/README.md?ref=${branch}`
      );
      return {
        content: Buffer.from(info.content, "base64").toString("utf8"),
        path: info.path,
        size: info.size,
      };
    } catch (err) {
      if (String(err.message).includes("404")) return null;
      throw err;
    }
  }

  // Commit a new version of README.md onto parentSha and return the new commit SHA.
  async createReadmeCommit({ content, message, date, parentSha, readmePath, branch }) {
    const newB64 = Buffer.from(content, "utf8").toString("base64");

    const blob = await this.request("POST", `/repos/${this.repo}/git/blobs`, {
      content: newB64,
      encoding: "base64",
    });

    const parentCommit = await this.request(
      "GET",
      `/repos/${this.repo}/git/commits/${parentSha}`
    );

    const tree = await this.request("POST", `/repos/${this.repo}/git/trees`, {
      base_tree: parentCommit.tree.sha,
      tree: [
        {
          path: readmePath,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        },
      ],
    });

    const commit = await this.request("POST", `/repos/${this.repo}/git/commits`, {
      message,
      tree: tree.sha,
      parents: [parentSha],
      author: { name: this.author.name, email: this.author.email, date },
      committer: { name: this.author.name, email: this.author.email, date },
    });

    await this.request("PATCH", `/repos/${this.repo}/git/refs/heads/${branch}`, {
      sha: commit.sha,
      force: false,
    });

    return commit.sha;
  }
}

module.exports = GitHubClient;
