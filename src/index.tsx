import { ActionPanel, List, Action, Image, Icon, Color } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

import TransitionIssue from "./TransitionIssue";
import jira from "./jira";

export interface LikeIssue {
  key: string;
  fields: {
    summary: string;
    statuscategorychangedate: string;
    status: {
      name: string;
    };
  };
}

function isTodayOrYesterday(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === today.toDateString() || date.toDateString() === yesterday.toDateString();
}

const shouldShowDoneIssue = (issue: LikeIssue) => {
  //only show issues that are in Done status if they are from today or yesterday
  const statusChangeDate = new Date(issue.fields.statuscategorychangedate);
  return issue.fields.status.name === "Done" && isTodayOrYesterday(statusChangeDate);
};

const getIssues = async () => {
  const allIssues = await jira.getUsersIssues("brandon.myers@zapier.com", false);
  const openIssues = allIssues.issues.filter(
    (issue: LikeIssue) =>
      issue.fields.status.name === "In Progress" ||
      issue.fields.status.name === "Review" ||
      issue.fields.status.name === "To Do" ||
      shouldShowDoneIssue(issue)
  );
  console.log("openIssues:", JSON.stringify(openIssues, null, 2));

  //sort by status
  openIssues.sort((a: LikeIssue, b: LikeIssue) => {
    if (a.fields.status.name === b.fields.status.name) {
      return 0;
    }
    if (a.fields.status.name === "To Do") {
      return -1;
    }
    if (a.fields.status.name === "In Progress" && b.fields.status.name === "Review") {
      return -1;
    }
    if (a.fields.status.name === "In Progress" && b.fields.status.name === "Done") {
      return -1;
    }
    if (a.fields.status.name === "Review" && b.fields.status.name === "Done") {
      return -1;
    }
    return 1;
  });

  return openIssues;
};
export default function Command() {
  const { data, isLoading } = useCachedPromise(getIssues);

  function getIconForStatus(name: string): Image.ImageLike {
    if (name === "Done") {
      return { source: Icon.Checkmark, tintColor: Color.Green };
    }
    if (name === "In Progress") {
      return { source: Icon.Pencil, tintColor: Color.Orange };
    }
    if (name === "Review") {
      return { source: Icon.Eye, tintColor: Color.Purple };
    }
    if (name === "To Do") {
      return { source: Icon.Circle, tintColor: Color.Blue };
    }
    return { source: Icon.Dot };
  }

  return (
    <List isLoading={isLoading}>
      {(data || []).map((issue: LikeIssue) => (
        <List.Item
          key={issue.key}
          icon={getIconForStatus(issue.fields.status.name)}
          title={`${issue.key} - ${issue.fields.summary}`}
          subtitle={issue.fields.status.name}
          actions={
            <ActionPanel>
              <Action.Paste title="Paste Key" content={issue.key} />
              <Action.Paste
                title="Paste Link"
                content={`[${issue.key} - ${issue.fields.summary}](https://zapierorg.atlassian.net/browse/${issue.key})`}
                shortcut={{ modifiers: ["cmd"], key: "return" }}
              />

              <Action.Paste
                title="Paste Create Branch"
                shortcut={{ modifiers: ["cmd", "shift"], key: "b" }}
                content={`git checkout -b ${issue.key}`}
              />
              <Action.Paste
                title="Checkout Branch"
                shortcut={{ modifiers: ["cmd"], key: "b" }}
                content={`git checkout ${issue.key}`}
              />
              <Action.Push
                title="Transistion Issue"
                target={<TransitionIssue issueKey={issue.key} />}
                shortcut={{ modifiers: ["cmd"], key: "t" }}
              />
              <Action.OpenInBrowser
                title="Open in Browser"
                url={`https://zapierorg.atlassian.net/browse/${issue.key}`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
