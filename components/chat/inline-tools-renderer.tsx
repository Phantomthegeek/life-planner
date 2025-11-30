'use client'

import { InlineFlashcard } from './inline-flashcard'
import { InlineQuiz } from './inline-quiz'

export interface InlineTool {
  type: 'flashcard' | 'quiz' | 'diagram' | 'table'
  data: any
}

interface InlineToolsRendererProps {
  tools?: InlineTool[]
  messageId?: string
}

export function InlineToolsRenderer({ tools, messageId }: InlineToolsRendererProps) {
  if (!tools || tools.length === 0) return null

  return (
    <div className="space-y-4 mt-4">
      {tools.map((tool, idx) => {
        if (tool.type === 'flashcard') {
          return (
            <InlineFlashcard
              key={`${messageId}-flashcard-${idx}`}
              front={tool.data.front || tool.data.message?.split('\n')[0] || 'Question'}
              back={tool.data.back || tool.data.message || 'Answer'}
              category={tool.data.category}
            />
          )
        }

        if (tool.type === 'quiz') {
          return (
            <InlineQuiz
              key={`${messageId}-quiz-${idx}`}
              question={tool.data.question || 'Question'}
              options={tool.data.options || []}
              explanation={tool.data.explanation}
            />
          )
        }

        // For diagram and table, we'll render as formatted text for now
        if (tool.type === 'table') {
          return (
            <div
              key={`${messageId}-table-${idx}`}
              className="my-4 overflow-x-auto"
            >
              <table className="min-w-full border-collapse border border-border">
                <tbody>
                  {tool.data.rows?.map((row: any, rowIdx: number) => (
                    <tr key={rowIdx}>
                      {row.map((cell: any, cellIdx: number) => (
                        <td
                          key={cellIdx}
                          className="border border-border p-2"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  )) || (
                    <tr>
                      <td className="border border-border p-2 text-muted-foreground">
                        Table data not available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

