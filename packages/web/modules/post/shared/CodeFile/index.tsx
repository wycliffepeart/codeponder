import { CodeCard, css } from "@codeponder/ui";
import * as React from "react";
import { useContext, useEffect, useState } from "react";
import { FlattenSimpleInterpolation } from "styled-components";
import {
  FindQuestionsComponent,
  QuestionInfoFragment,
} from "../../../../generated/apollo-components";
import { getHighlightedHTML } from "../../../../utils/highlightCode";
import { PostContext } from ".././PostContext";
import { RenderLine } from "./CodeLine";

interface LoadingCodeState {
  pending: boolean;
  resolved?: string[];
}

/*
 * *Styles for the line numbers coming from the server
 *
 */
const selectLines = (
  prop: QuestionInfoFragment[]
): FlattenSimpleInterpolation => {
  const styles = prop.reduce((total, current) => {
    const { lineNum } = current;
    total += `
     & .token-line:nth-child(n+${lineNum}):nth-child(-n+${lineNum}) {
      background: hsla(24, 20%, 50%,.08);
      background: linear-gradient(to right, hsla(24, 20%, 50%,.1) 70%, hsla(24, 20%, 50%,0));
    }
     `;
    return total;
  }, "");

  return css`
    ${styles}
  `;
};

const PLUSBUTTON = `<button class="btn-open-edit token-btn">+</button>`;

const useHighlight = (lang: string, code: string): LoadingCodeState => {
  const [highlightCode, setHighlightCode] = useState<LoadingCodeState>({
    pending: true,
  });

  useEffect(() => {
    const highlightedHTML = getHighlightedHTML(code, lang);
    const tokens = highlightedHTML.split("\n").map(line => {
      return `${PLUSBUTTON}${line}`;
    });

    setHighlightCode({ pending: false, resolved: tokens });
  }, []);
  return highlightCode;
};

export const CodeFile: React.FC<{ questionId?: string }> = ({
  questionId,
}): JSX.Element => {
  const { code, lang, path, postId } = useContext(PostContext);
  const highlightCode = useHighlight(lang, code || "");

  return (
    <FindQuestionsComponent
      variables={{
        path,
        postId,
      }}
    >
      {({ data, loading }) => {
        if (!data || loading || highlightCode.pending) {
          return null;
        }

        const questionMap: Record<string, QuestionInfoFragment> = {};

        data.findQuestions.forEach(q => {
          if (q.lineNum) {
            questionMap[q.lineNum] = q;
          }
        });

        return (
          <CodeCard lang={lang} selectedLines={selectLines(data.findQuestions)}>
            {(highlightCode.resolved || []).map((line, index) => {
              return (
                <RenderLine
                  key={index}
                  question={questionMap[index + 1]}
                  line={line}
                  lineNum={index + 1}
                  openQuestionId={questionId}
                />
              );
            })}
          </CodeCard>
        );
      }}
    </FindQuestionsComponent>
  );
};
