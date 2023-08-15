import { ActionPanel, List, Action, closeMainWindow } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import jira from "./jira";
import JiraApi from "jira-client";

interface Props {
  issueKey: string;
}
const getTransitions = async (key: string) => {
  const transitions = await jira.listTransitions(key);
  console.log("transitions:", JSON.stringify(transitions, null, 2));
  return transitions;
};
const TransitionIssue = ({ issueKey }: Props) => {
  const { data, isLoading } = useCachedPromise(getTransitions, [issueKey]);

  return (
    <List isLoading={isLoading}>
      {(data?.transitions || []).map((transition: JiraApi.TransitionObject) => (
        <List.Item
          key={transition.id}
          icon="list-icon.png"
          title={transition.name}
          actions={
            <ActionPanel>
              <Action
                title="Paste Key"
                onAction={async () => {
                  console.log("transitioning to", transition.name);
                  const res = await jira.transitionIssue(issueKey, { transition: { id: transition.id } });
                  console.log("res", res);
                  closeMainWindow();
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
};

export default TransitionIssue;
