import JiraApi from "jira-client";

const jira = new JiraApi({
  protocol: "https",
  host: "",
  username: "",
  password: "",
  apiVersion: "2",
  strictSSL: true,
});

export default jira;
