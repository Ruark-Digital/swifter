import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Info } from "lucide-react";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import MessageThread from "./MessageThread";
import MessageComposer from "./MessageComposer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CreateAddendumDialog from "./CreateAddendumDialog";
import { formatDateTZ, zonedTimeToUtc } from "@/lib/utils";

// Question type definition
export interface Question {
  _id: string;
  solicitation: string;
  user: User;
  note: string;
  responses: QuestionResponse[];
  isAnswered: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface User {
  _id: string;
  name: string;
  role: Role;
  avatar: string;
}

export interface Role {
  _id: string;
  name: string;
  __v: number;
}

export interface QuestionResponse {
  _id: string;
  solicitation: string;
  user: User;
  note: string;
  responses: QuestionResponse[];
  isAnswered: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
type QuestionsResponse = {
  message: string;
  data: {
    totalAnswers: number;
    questionCount: number;
    questions: Question[];
  };
};

interface QuestionsTabProps {
  solicitationStatus?: string;
  isOwner?: boolean;
  questionDeadline?: string | null;
  timezone?: string;
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({
  solicitationStatus,
  isOwner,
  questionDeadline,
  timezone,
}) => {
  const queryClient = useQueryClient();
  const toastHandler = useToastHandler();
  const { id: solicitationId } = useParams<{ id: string }>();
  const { isVendor, isProcurement, isEvaluator } = useUserRole();
  const user = useUser();
  const [replyToQuestion, setReplyToQuestion] = useState<Question | null>(null);
  const [sendType, setSendType] = useState<"reply" | "addendum" | null>(null);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [isCreateAddendumDialogOpen, setIsCreateAddendumDialogOpen] =
    useState(false);
  const [questionDraftClearSignal, setQuestionDraftClearSignal] = useState(0);

  const questionDeadlineDate = useMemo(() => {
    if (!questionDeadline) return null;
    const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(questionDeadline);
    const parsed = hasOffset
      ? new Date(questionDeadline)
      : zonedTimeToUtc(questionDeadline, timezone || "UTC");
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [questionDeadline, timezone]);
  const questionDeadlinePassed = Boolean(
    questionDeadlineDate && Date.now() >= questionDeadlineDate.getTime(),
  );

  // Fetch questions
  const { data: questionsData, isLoading } = useQuery<QuestionsResponse>({
    queryKey: ["solicitation-questions", solicitationId],
    queryFn: async () => {
      const response = await getRequest({
        url: isVendor
          ? `/vendor/solicitations/${solicitationId}/questions`
          : `/procurement/solicitations/${solicitationId}/questions`,
      });
      return response.data;
    },
    enabled: !!solicitationId,
  });

  // Create question mutation (for vendors)
  const createQuestionMutation = useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      if (!solicitationId) throw new Error("Solicitation ID is required");
      return await postRequest({
        url: isVendor
          ? `/vendor/solicitations/${solicitationId}/questions`
          : `/procurement/solicitations/${solicitationId}/questions`,
        payload: { note },
      });
    },
    onSuccess: () => {
      toastHandler.success("Success", "Question submitted successfully");
      setShowCreateQuestion(false);
      setQuestionDraftClearSignal((signal) => signal + 1);
      queryClient.invalidateQueries({
        queryKey: ["solicitation-questions", solicitationId],
      });
    },
    onError: (error: any) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message || "Failed to submit question"
      );
    },
  });

  // Reply mutation (for procurement and evaluators)
  const replyMutation = useMutation({
    mutationFn: async ({
      questionId,
      note,
    }: {
      questionId: string;
      note: string;
    }) => {
      if (!solicitationId) throw new Error("Solicitation ID is required");
      return await postRequest({
        url: isVendor
          ? `/vendor/solicitations/${solicitationId}/questions/${questionId}`
          : `/procurement/solicitations/${solicitationId}/questions/${questionId}`,
        payload: { note },
      });
    },
    onSuccess: () => {
      toastHandler.success("Success", "Reply sent successfully");
      setReplyToQuestion(null);
      setSendType(null);
      queryClient.invalidateQueries({
        queryKey: ["solicitation-questions", solicitationId],
      });
    },
    onError: (error: any) => {
      toastHandler.error(
        "Error",
        error?.response?.data?.message || "Failed to send reply"
      );
    },
  });

  // Filter questions based on vendor visibility rules
  const filteredQuestions: Question[] = useMemo(() => {
    const allQuestions = questionsData?.data?.questions || [];

    if (!isVendor || !user) {
      // Non-vendors see all questions
      return allQuestions;
    }

    // For vendors: only show questions they submitted OR questions with published responses
    // return allQuestions.filter((question: Question) => {
    //   // Show questions submitted by the current vendor
    //   if (question.user._id === user._id) {
    //     return true;
    //   }

    //   // Show questions that have been answered (published responses)
    //   if (
    //     question.isAnswered &&
    //     question.responses &&
    //     question.responses.length > 0
    //   ) {
    //     // Check if any response is from procurement/evaluator (published response)
    //     const hasPublishedResponse = question.responses.some(
    //       (response: QuestionResponse) => {
    //         return (
    //           response.user.role.name === "procurement" ||
    //           response.user.role.name === "evaluator" ||
    //           response.user.role.name === "company_admin" ||
    //           response.user.role.name === "super_admin"
    //         );
    //       }
    //     );
    //     return hasPublishedResponse;
    //   }

    //   return false;
    // });
    return allQuestions
  }, [questionsData?.data?.questions, isVendor, user]);

  const questions: Question[] = filteredQuestions;
  const unansweredQuestions = questions.filter((q: Question) => !q.isAnswered);

  const handleSendMessage = (
    content: string,
    type?: "reply" | "addendum" | null
  ) => {
    if (!replyToQuestion && !sendType) {
      // Handle creating new question (vendors only)
      if (!content.trim()) return;
      createQuestionMutation.mutate({
        note: content.trim(),
      });
    } else if (
      (type === "addendum" || sendType === "addendum") &&
      replyToQuestion &&
      solicitationStatus !== "closed" &&
      solicitationStatus !== "awarded"
    ) {
      // Handle replying with addendum - open CreateAddendumDialog
      setIsCreateAddendumDialogOpen(true);
    } else {
      // Handle replying to existing question (procurement/evaluators only)
      if (!replyToQuestion || !content.trim()) return;
      replyMutation.mutate({
        questionId: replyToQuestion._id,
        note: content.trim(),
      });
    }
  };

  const handleReplyClick = (
    questionId: string,
    type: "reply" | "addendum" | null
  ) => {
    const question = questions.find((q: Question) => q._id === questionId);
    if (!question) return;

    setReplyToQuestion(question);
    setSendType(type);
    if (
      type === "addendum" &&
      solicitationStatus !== "closed" &&
      solicitationStatus !== "awarded"
    )
      setIsCreateAddendumDialogOpen(true);
    setShowCreateQuestion(false);
  };

  const handleCancelCreateQuestion = () => {
    setShowCreateQuestion(false);
    setReplyToQuestion(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header Cards */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Questions
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-200">
                  {unansweredQuestions.length}
                </p>
                {/* <p className="text-sm text-gray-500 mt-1">
                  {unansweredQuestions.length === 1
                    ? "1 Unanswered"
                    : `${unansweredQuestions.length} Unanswered`}
                </p> */}
              </div>
              <div className="p-3 rounded-full bg-red-50 dark:bg-slate-900">
                <HelpCircle className="h-6 w-6 text-red-600 dark:text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={``}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Answered Questions
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-200">
                  {questionsData?.data.totalAnswers || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 dark:bg-slate-900">
                <Info className="h-6 w-6 text-blue-600 dark:text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-4 mb-5">
        {questions.map((question: Question) => (
          <MessageThread
            key={question._id}
            question={question}
            sendType={sendType}
            onReply={!question.isAnswered && !(isProcurement && !isOwner) ? handleReplyClick : undefined}
            solicitationStatus={solicitationStatus}
          />
        ))}
      </div>

      {isVendor && questionDeadlinePassed && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Questions closed on {formatDateTZ(questionDeadlineDate, "MMM d, yyyy h:mm a")}.
        </div>
      )}

      {/* Create Addendum Dialog */}
      <Dialog
        open={isCreateAddendumDialogOpen}
        onOpenChange={setIsCreateAddendumDialogOpen}
      >
        <DialogContent className="max-w-2xl sm:max-h-[min(640px,90vh)] overflow-auto">
          <CreateAddendumDialog
            solicitationId={solicitationId!}
            questionId={replyToQuestion?._id}
            onClose={() => {
              setIsCreateAddendumDialogOpen(false);
              setReplyToQuestion(null);
              setSendType(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Message Composer - Conditional Visibility */}
      {(isVendor ||
        ((isProcurement || isEvaluator) &&
          (replyToQuestion || questions.length > 0))) && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            {showCreateQuestion && (
              <Button
                variant="outline"
                onClick={handleCancelCreateQuestion}
                size="sm"
              >
                Cancel
              </Button>
            )}
          </div>
                  <MessageComposer
            onSend={handleSendMessage}
            isNewChat={questions.length === 0}
                    isLoading={
                      createQuestionMutation.isPending || replyMutation.isPending
                    }
                    clearOnSend={!isVendor}
                    clearSignal={questionDraftClearSignal}
            replyToUser={
              replyToQuestion
                ? {
                    name: replyToQuestion.user.name,
                    avatar: "https://i.pravatar.cc/300", //replyToQuestion.user.avatar,
                  }
                : showCreateQuestion
                ? { name: "Procurement Team" }
                : undefined
            }
            currentUser={{ name: "You" }}
            sendType={sendType}
            onSendTypeChange={setSendType}
                    disabled={
                      (isProcurement && !isOwner) ||
                      (isVendor && questionDeadlinePassed)
                    }
          />
        </div>
      )}
    </div>
  );
};

export default QuestionsTab;
