"use client";

import styles from "./page.module.css";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import SelectMenu from "@/components/select-menu/selectmenu";
import {
  SubjectOptions,
  Biology,
  History,
  SubjectOption,
} from "@/components/select-menu/data";
import { MentionsInput, Mention, SuggestionDataItem } from "react-mentions";
import {
  Container,
  Flex,
  Heading,
  Box,
  Card,
  Text,
} from "@radix-ui/themes";
import {
  CaretRightIcon,
  ListBulletIcon,
  GridIcon,
} from "@radix-ui/react-icons";
import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Assignment {
  id: number;
  title: string;
  subject: string;
  learningOutcomes: string;
  markingCriteria: string;
  additionalPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export default function AssignmentListPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");
  const [markingCriteria, setMarkingCriteria] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(
    null
  );
  const [scrollStates, setScrollStates] = useState<{
    [subject: string]: { showScrollButtons: boolean };
  }>({});
  const [isListView, setIsListView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Refs for textareas
  const learningOutcomesRef = useRef<HTMLTextAreaElement>(null);
  const markingCriteriaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch assignments on mount
  useEffect(() => {
    fetch("/api/assignment")
      .then((res) => res.json())
      .then((data) => setAssignments(data))
      .catch((err) => console.error("Error fetching assignments", err));
  }, []);

  // Restore list/grid view preference
  useEffect(() => {
    setIsMounted(true);
    const storedView = localStorage.getItem("adminListView");
    if (storedView !== null) {
      setIsListView(storedView === "true");
    }
  }, []);

  // Store list/grid view preference
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("adminListView", isListView.toString());
    }
  }, [isListView, isMounted]);

  // Group assignments by subject
  const groupedAssignments = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      const subj = assignment.subject;
      if (!acc[subj]) acc[subj] = [];
      acc[subj].push(assignment);
      return acc;
    }, {} as { [key: string]: Assignment[] });
  }, [assignments]);

  // Refs for each subject section (for horizontal scrolling if needed)
  const rowRefs = useMemo(() => {
    const refs: { [subject: string]: React.RefObject<HTMLDivElement> } = {};
    for (const subj of Object.keys(groupedAssignments)) {
      refs[subj] = React.createRef<HTMLDivElement>();
    }
    return refs;
  }, [groupedAssignments]);

  // Check if horizontal scroll is needed
  useEffect(() => {
    const newScrollStates: {
      [subject: string]: { showScrollButtons: boolean };
    } = {};
    for (const subj of Object.keys(groupedAssignments)) {
      const element = rowRefs[subj].current;
      if (element) {
        const overflow = element.scrollWidth > element.clientWidth;
        newScrollStates[subj] = { showScrollButtons: overflow };
      }
    }
    setScrollStates(newScrollStates);
  }, [assignments, groupedAssignments, rowRefs]);

  // If you have special placeholders for biology, history
  const processTemplateText = (text: string) => {
    const templateMap: { [key: string]: string } = {
      "biology-prompt": Biology,
      "history-prompt": History,
    };
    return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, (match, display, id) => {
      return templateMap[id] || match;
    });
  };

  // Handle subject changes
  const handleSubjectChange = (selectedOption: SubjectOption | null) => {
    if (
      subject === "Custom" &&
      selectedOption &&
      selectedOption.value !== "Custom"
    ) {
      const confirmChange = window.confirm(
        "Changing the subject will reset your additional prompt. Do you want to proceed?"
      );
      if (!confirmChange) return;
      setAdditionalPrompt("");
    }

    setSelectedSubject(selectedOption);
    setSubject(selectedOption ? selectedOption.value : "");

    if (selectedOption) {
      if (selectedOption.value === "Biology") {
        setAdditionalPrompt(`@[biology-prompt](biology-prompt)`);
      } else if (selectedOption.value === "History") {
        setAdditionalPrompt(`@[history-prompt](history-prompt)`);
      } else if (selectedOption.value === "Custom") {
        setAdditionalPrompt("");
      }
    } else {
      setAdditionalPrompt("");
    }
  };

  /**
   * autoResize: 
   *    - auto-resize up to 8 lines, 
   *    - if content is > 8 lines, then overflow: scroll.
   */
  const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
    if (!textarea) return;

    // First, reset height so scrollHeight is always accurate
    textarea.style.height = "auto";
    textarea.style.overflowY = "hidden";

    // Compute the line-height
    const style = window.getComputedStyle(textarea);
    const lineHeightStr = style.lineHeight;
    // Fallback if parse fails
    let lineHeight = parseInt(lineHeightStr, 10) || 20;

    const scrollHeight = textarea.scrollHeight;
    const maxHeight = lineHeight * 8; // 8 lines

    // If the content would exceed 8 lines
    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto"; // show scroll
    } else {
      // Otherwise, just auto-fit
      textarea.style.height = `${scrollHeight}px`;
    }
  }, []);

  // autoResizeAllTextareas depends on autoResize, so also useCallback
  const autoResizeAllTextareas = useCallback(() => {
    if (learningOutcomesRef.current) autoResize(learningOutcomesRef.current);
    if (markingCriteriaRef.current) autoResize(markingCriteriaRef.current);
  }, [autoResize]);

  // Whenever we open the form, recalc
  useEffect(() => {
    if (showForm) {
      // small timeout ensures the DOM is updated
      setTimeout(() => autoResizeAllTextareas(), 0);
    }
  }, [showForm, autoResizeAllTextareas]);

  // re-run if learningOutcomes changes (and form is open)
  useEffect(() => {
    if (showForm) {
      autoResizeAllTextareas();
    }
  }, [learningOutcomes, showForm, autoResizeAllTextareas]);

  // re-run if markingCriteria changes (and form is open)
  useEffect(() => {
    if (showForm) {
      autoResizeAllTextareas();
    }
  }, [markingCriteria, showForm, autoResizeAllTextareas]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !learningOutcomes || !markingCriteria) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    // Some special checks
    if (
      selectedSubject?.value === "Custom" &&
      /@\[([^\]]+)\]\(([^)]+)\)/g.test(additionalPrompt)
    ) {
      alert("Using custom prompt with tags might create issues.");
    }

    if (
      selectedSubject?.value === "Biology" &&
      additionalPrompt.trim() !== "@[biology-prompt](biology-prompt)"
    ) {
      alert(
        "For Biology subject, the Additional Prompt should contain only the biology-prompt tag."
      );
      return;
    }

    if (
      selectedSubject?.value === "History" &&
      additionalPrompt.trim() !== "@[history-prompt](history-prompt)"
    ) {
      alert(
        "For History subject, the Additional Prompt should contain only the history-prompt tag."
      );
      return;
    }

    try {
      const url = editingAssignmentId
        ? `/api/assignment/${editingAssignmentId}`
        : "/api/assignment";
      const method = editingAssignmentId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subject,
          learningOutcomes,
          markingCriteria,
          additionalPrompt,
        }),
      });

      if (response.ok) {
        const savedAssignment = await response.json();
        if (editingAssignmentId) {
          setAssignments(
            assignments.map((assignment) =>
              assignment.id === editingAssignmentId ? savedAssignment : assignment
            )
          );
          setSuccessMessage("Assignment updated successfully!");
        } else {
          setAssignments([...assignments, savedAssignment]);
          setSuccessMessage("Assignment added successfully!");
        }
        resetForm();
      } else {
        setErrorMessage("Failed to save assignment");
      }
    } catch (error) {
      setErrorMessage("An error occurred while saving the assignment");
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setSubject("");
    setLearningOutcomes("");
    setMarkingCriteria("");
    setAdditionalPrompt("");
    setEditingAssignmentId(null);
    setErrorMessage(null);
    setShowForm(false);
    setSelectedSubject(null);
  };

  // Edit existing assignment
  const handleEdit = (assignment: Assignment) => {
    setTitle(assignment.title);
    setSubject(assignment.subject);
    setLearningOutcomes(assignment.learningOutcomes);
    setMarkingCriteria(assignment.markingCriteria);
    setAdditionalPrompt(assignment.additionalPrompt);
    setEditingAssignmentId(assignment.id);
    setShowForm(true);

    const selectedOption = SubjectOptions.find(
      (option) => option.value === assignment.subject
    );
    setSelectedSubject(selectedOption || null);
  };

  // Add new assignment
  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  // Delete assignment
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/assignment/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAssignments(assignments.filter((assignment) => assignment.id !== id));
        setSuccessMessage("Assignment deleted successfully!");
      } else {
        setErrorMessage("Failed to delete assignment");
      }
    } catch (error) {
      setErrorMessage("An error occurred while deleting the assignment");
    }
  };

  // Mention data
  const mentionData: SuggestionDataItem[] = [
    { id: "biology-prompt", display: "biology-prompt" },
    { id: "history-prompt", display: "history-prompt" },
  ];

  // Helper to render any mention markup
  const renderMentions = (text: string) => {
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = regex.lastIndex;
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start));
      }
      parts.push(
        <span key={start} className={styles.mentionsMention}>
          {match[1]}
        </span>
      );
      lastIndex = end;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  function AssignmentCard({
    assignment,
    isListView,
  }: {
    assignment: Assignment;
    isListView: boolean;
  }) {
    if (isListView) {
      return (
        <Card
          size="1"
          className={`${styles.listAssignmentCard} 
                      transition-all 
                      dark:bg-gray-800 dark:text-white
                      hover:dark:bg-gray-700`}
        >
          <Flex gap="3" align="center" p="2" justify="between">
            <Flex gap="3" align="center" style={{ flex: 1 }}>
              <div className={styles.customAvatar}>
                {assignment.subject[0] || "A"}
              </div>
              <Box className="flex-1">
                <Text
                  as="div"
                  size="2"
                  weight="bold"
                  style={{ marginBottom: "-2px" }}
                >
                  {assignment.title}
                </Text>
                <Text as="div" size="2" color="gray" style={{ lineHeight: "1.2" }}>
                  {assignment.subject} &middot; Updated{" "}
                  {new Date(assignment.updatedAt).toDateString()}
                </Text>
              </Box>
            </Flex>
            <Flex gap="2" align="center" justify="end">
              <button
                onClick={() => handleEdit(assignment)}
                className={`${styles.editButton} dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100`}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(assignment.id)}
                className={`${styles.deleteButton} dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100`}
              >
                Delete
              </button>
              <Link
                href={`/admin/assignment/${assignment.id}`}
                className={`${styles.assignmentsLink} dark:text-blue-300`}
              >
                <CaretRightIcon height={24} width={24} />
              </Link>
            </Flex>
          </Flex>
        </Card>
      );
    } else {
      return (
        <div
          className={`${styles.customCard} 
                      dark:bg-gray-800 dark:text-white
                      transition-all 
                      hover:dark:bg-gray-700`}
        >
          <div className={styles.customAvatar}>
            {assignment.subject[0] || "A"}
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{assignment.title}</div>
            <div className={styles.cardSubtitle}>
              Updated {new Date(assignment.updatedAt).toDateString()}
            </div>
          </div>
          <div className={styles.cardActions}>
            <button
              onClick={() => handleEdit(assignment)}
              className={`${styles.editButton} dark:bg-gray-500 dark:hover:bg-gray-600 dark:text-gray-100`}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(assignment.id)}
              className={`${styles.deleteButton} dark:bg-gray-500 dark:hover:bg-gray-600 dark:text-gray-100`}
            >
              Delete
            </button>
            <a
              className={`${styles.assignmentsLink} dark:text-blue-300`}
              href={`/admin/assignment/${assignment.id}`}
            >
              View Details
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    isMounted && (
      <div className={`${styles.assignmentPage} dark:bg-[#1F1F1F] dark:text-white`}>
        <div className={styles.assignmentContainer}>
          {!showForm ? (
            <div className={styles.assignmentList}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Teachers</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <Container className="p-8">
                <Flex align="center" justify="between" mb="4">
                  <Heading as="h1" className="dark:text-white">
                    Assignment List
                  </Heading>
                  <button
                    onClick={() => setIsListView((prev) => !prev)}
                    className={`
                      ${styles.viewToggleButton} 
                      dark:hover:bg-transparent dark:text-white
                    `}
                  >
                    {isListView ? (
                      <ListBulletIcon width="24" height="24" />
                    ) : (
                      <GridIcon width="24" height="24" />
                    )}
                  </button>
                </Flex>
                {isListView ? (
                  Object.entries(groupedAssignments).map(
                    ([subj, subjectAssignments]) => (
                      <div key={subj} className={styles.subjectSection}>
                        <Heading
                          as="h2"
                          size="5"
                          className="subjectHeading dark:text-white"
                        >
                          {subj}
                        </Heading>
                        <div className={styles.listContainer}>
                          {subjectAssignments.map((assignment) => (
                            <AssignmentCard
                              key={assignment.id}
                              assignment={assignment}
                              isListView={isListView}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  Object.entries(groupedAssignments).map(
                    ([subj, subjectAssignments]) => (
                      <div key={subj} className={styles.subjectSection}>
                        <Heading
                          as="h2"
                          size="5"
                          className="subjectHeading dark:text-white"
                        >
                          {subj}
                        </Heading>
                        <div className={styles.cardContainer}>
                          {subjectAssignments.map((assignment) => (
                            <AssignmentCard
                              key={assignment.id}
                              assignment={assignment}
                              isListView={isListView}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )
                )}
                <button
                  onClick={handleAdd}
                  className={`
                    ${styles.addButton} 
                    dark:bg-gray-700 
                    dark:hover:bg-gray-600 
                    dark:text-white
                  `}
                >
                  Add New Assignment
                </button>
              </Container>
            </div>
          ) : (
            <div className={styles.assignmentForm}>
              <h3 className="dark:text-white">
                {editingAssignmentId ? "Edit Assignment" : "Add New Assignment"}
              </h3>
              {errorMessage && (
                <p className={`${styles.errorMessage} dark:text-red-300`}>
                  {errorMessage}
                </p>
              )}
              {successMessage && (
                <p className={`${styles.successMessage} dark:text-green-300`}>
                  {successMessage}
                </p>
              )}
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label
                    className={`${styles.labels} dark:text-gray-300`}
                  >
                    Title:
                  </label>
                  <input
                    type="text"
                    className={`${styles.input} dark:bg-gray-700 dark:text-white`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.labels} dark:text-gray-300`}
                  >
                    Learning Outcomes:
                  </label>
                  <textarea
                    ref={learningOutcomesRef}
                    className={`${styles.textarea} dark:bg-gray-700 dark:text-white`}
                    value={learningOutcomes}
                    onChange={(e) => {
                      setLearningOutcomes(e.target.value);
                      autoResizeAllTextareas();
                    }}
                    rows={1}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.labels} dark:text-gray-300`}
                  >
                    Marking Criteria:
                  </label>
                  <textarea
                    ref={markingCriteriaRef}
                    className={`${styles.textarea} dark:bg-gray-700 dark:text-white`}
                    value={markingCriteria}
                    onChange={(e) => {
                      setMarkingCriteria(e.target.value);
                      autoResizeAllTextareas();
                    }}
                    rows={1}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.labels} dark:text-gray-300`}
                  >
                    Subject:
                  </label>
                  <div className={styles.selectMenuContainer}>
                    <SelectMenu
                      onChange={handleSubjectChange}
                      value={selectedSubject}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.labels} dark:text-gray-300`}
                  >
                    Additional Prompt:
                  </label>
                  {selectedSubject?.value === "Custom" ? (
                    <MentionsInput
                      value={additionalPrompt}
                      onChange={(event, newValue) =>
                        setAdditionalPrompt(newValue)
                      }
                      placeholder="Type '@' to select a prompt..."
                      className={`${styles.mentions} dark:bg-gray-700 dark:text-white mb-1.5`}
                      allowSuggestionsAboveCursor={true}
                      style={{ height: "200px" }}
                      singleLine={false}
                    >
                      <Mention
                        trigger="@"
                        data={mentionData}
                        markup="@[$__display__]($__id__)"
                        appendSpaceOnAdd={true}
                        renderSuggestion={(
                          suggestion,
                          search,
                          highlightedDisplay,
                          index,
                          focused
                        ) => (
                          <div
                            className={`
                              ${styles.suggestionItem} 
                              ${focused ? styles.focused : ""} 
                              dark:text-white 
                              dark:bg-gray-600
                            `}
                          >
                            {highlightedDisplay}
                          </div>
                        )}
                      />
                    </MentionsInput>
                  ) : (
                    <div
                      className={`
                        ${styles.mentions} 
                        ${styles.readOnly}
                        dark:bg-gray-800 dark:text-white mb-5
                      `}
                    >
                      {renderMentions(additionalPrompt)}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`
                    ${styles.submitButton} 
                    dark:bg-green-700 dark:hover:bg-green-600 dark:text-white
                  `}
                >
                  {editingAssignmentId ? "Save" : "Add Assignment"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`
                    ${styles.cancelButton}
                    dark:bg-red-700 dark:hover:bg-red-600 dark:text-white
                  `}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  );
}
