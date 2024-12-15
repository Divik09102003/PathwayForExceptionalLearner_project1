"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SelectMenu from '@/components/select-menu/selectmenu';
import { SubjectOptions, Biology, History, SubjectOption } from '@/components/select-menu/data';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { Container, Flex, Heading } from "@radix-ui/themes";
import styles from "./page.module.css";
import { CaretRightIcon, CaretLeftIcon } from "@radix-ui/react-icons";
import React from "react";

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
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(null);
  const [scrollStates, setScrollStates] = useState<{ [subject: string]: { showScrollButtons: boolean } }>({});

  useEffect(() => {
    fetch("/api/assignment")
      .then((res) => res.json())
      .then((data) => setAssignments(data))
      .catch((err) => console.error("Error fetching assignments", err));
  }, []);

  const groupedAssignments = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      const subj = assignment.subject;
      if (!acc[subj]) acc[subj] = [];
      acc[subj].push(assignment);
      return acc;
    }, {} as { [key: string]: Assignment[] });
  }, [assignments]);

  // Instead of using useRef in a loop, we use createRef which is not a hook.
  const rowRefs = useMemo(() => {
    const refs: { [subject: string]: React.RefObject<HTMLDivElement> } = {};
    for (const subj of Object.keys(groupedAssignments)) {
      refs[subj] = React.createRef<HTMLDivElement>();
    }
    return refs;
  }, [groupedAssignments]);

  useEffect(() => {
    // Check scroll states once refs and assignments are known
    const newScrollStates: { [subject: string]: { showScrollButtons: boolean } } = {};
    for (const subj of Object.keys(groupedAssignments)) {
      const element = rowRefs[subj].current;
      if (element) {
        const overflow = element.scrollWidth > element.clientWidth;
        newScrollStates[subj] = { showScrollButtons: overflow };
      }
    }
    setScrollStates(newScrollStates);
  }, [assignments, groupedAssignments, rowRefs]);

  const processTemplateText = (text: string) => {
    const templateMap: { [key: string]: string } = {
      'biology-prompt': Biology,
      'history-prompt': History,
    };
    return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, (match, display, id) => {
      return templateMap[id] || match;
    });
  };

  const handleSubjectChange = (selectedOption: SubjectOption | null) => {
    if (
      subject === 'Custom' &&
      selectedOption &&
      selectedOption.value !== 'Custom'
    ) {
      const confirmChange = window.confirm(
        'Changing the subject will reset your additional prompt. Do you want to proceed?'
      );
      if (!confirmChange) return;
      setAdditionalPrompt('');
    }

    setSelectedSubject(selectedOption);
    setSubject(selectedOption ? selectedOption.value : '');

    if (selectedOption) {
      if (selectedOption.value === 'Biology') {
        setAdditionalPrompt(`@[biology-prompt](biology-prompt)`);
      } else if (selectedOption.value === 'History') {
        setAdditionalPrompt(`@[history-prompt](history-prompt)`);
      } else if (selectedOption.value === 'Custom') {
        setAdditionalPrompt('');
      }
    } else {
      setAdditionalPrompt('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !learningOutcomes || !markingCriteria) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (
      selectedSubject?.value === 'Custom' &&
      /@\[([^\]]+)\]\(([^)]+)\)/g.test(additionalPrompt)
    ) {
      alert('Using custom prompt with tags might create issues.');
    }

    if (selectedSubject?.value === 'Biology' && additionalPrompt.trim() !== '@[biology-prompt](biology-prompt)') {
      alert('For Biology subject, the Additional Prompt should contain only the biology-prompt tag.');
      return;
    }

    if (selectedSubject?.value === 'History' && additionalPrompt.trim() !== '@[history-prompt](history-prompt)') {
      alert('For History subject, the Additional Prompt should contain only the history-prompt tag.');
      return;
    }

    try {
      const url = editingAssignmentId ? `/api/assignment/${editingAssignmentId}` : "/api/assignment";
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

  const handleEdit = (assignment: Assignment) => {
    setTitle(assignment.title);
    setSubject(assignment.subject);
    setLearningOutcomes(assignment.learningOutcomes);
    setMarkingCriteria(assignment.markingCriteria);
    setAdditionalPrompt(assignment.additionalPrompt);
    setEditingAssignmentId(assignment.id);
    setShowForm(true);

    const selectedOption = SubjectOptions.find(option => option.value === assignment.subject);
    setSelectedSubject(selectedOption || null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

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

  function AssignmentCard({ assignment }: { assignment: Assignment }) {
    return (
      <div className={styles.assignmentCard}>
        <div className={styles.customCard}>
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
              className={styles.editButton}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(assignment.id)}
              className={styles.deleteButton}
            >
              Delete
            </button>
            <a
              className={styles.assignmentsLink}
              href={`/admin/assignment/${assignment.id}`}
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    );
  }

  const mentionData: SuggestionDataItem[] = [
    { id: 'biology-prompt', display: 'biology-prompt' },
    { id: 'history-prompt', display: 'history-prompt' },
  ];

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
        <span key={start} className="mentions__mention">
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

  const scrollLeft = (subj: string) => {
    const ref = rowRefs[subj].current;
    if (ref) {
      ref.scrollBy({ top: 0, left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = (subj: string) => {
    const ref = rowRefs[subj].current;
    if (ref) {
      ref.scrollBy({ top: 0, left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="assignment-page">
      <div className="assignment-container">
        {!showForm ? (
          <div className="assignment-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/">
                <h1 style={{ cursor: "pointer" }}>Home</h1>
              </Link>
            </div>
            <Container className="p-8">
              <Heading as="h1" className="mb-4">
                Assignment List
              </Heading>
              {Object.entries(groupedAssignments).map(([subj, subjectAssignments]) => {
                const { showScrollButtons = false } = scrollStates[subj] || {};
                return (
                  <div key={subj} className={styles.subjectSection}>
                    <Heading as="h2" size="5" className={styles.subjectHeading}>{subj}</Heading>
                    <div className={styles.cardRowContainer}>
                      {showScrollButtons && (
                        <button 
                          className={styles.scrollButtonLeft} 
                          onClick={() => scrollLeft(subj)}
                          aria-label="Scroll left"
                        >
                          <CaretLeftIcon />
                        </button>
                      )}
                      <Flex className={styles.cardRow} ref={rowRefs[subj]}>
                        {subjectAssignments.map((assignment) => (
                          <AssignmentCard key={assignment.id} assignment={assignment} />
                        ))}
                      </Flex>
                      {showScrollButtons && (
                        <button 
                          className={styles.scrollButtonRight} 
                          onClick={() => scrollRight(subj)}
                          aria-label="Scroll right"
                        >
                          <CaretRightIcon />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <button onClick={handleAdd} className="add-button">
                Add New Assignment
              </button>
            </Container>
          </div>
        ) : (
          <div className="assignment-form">
            <h3>
              {editingAssignmentId ? "Edit Assignment" : "Add New Assignment"}
            </h3>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && (
              <p className="success-message">{successMessage}</p>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Learning Outcomes:</label>
                <textarea
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Marking Criteria:</label>
                <textarea
                  value={markingCriteria}
                  onChange={(e) => setMarkingCriteria(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <SelectMenu onChange={handleSubjectChange} value={selectedSubject} />
              </div>
              <div className="form-group">
                <label>Additional Prompt:</label>
                {selectedSubject?.value === 'Custom' ? (
                  <MentionsInput
                    value={additionalPrompt}
                    onChange={(event, newValue) => setAdditionalPrompt(newValue)}
                    placeholder="Type '@' to select a prompt..."
                    className="mentions"
                    allowSuggestionsAboveCursor={true}
                    style={{ height: '200px' }}
                    singleLine={false}
                  >
                    <Mention
                      trigger="@"
                      data={mentionData}
                      markup="@[$__display__]($__id__)"
                      appendSpaceOnAdd={true}
                      renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                        <div className={`suggestion-item ${focused ? 'focused' : ''}`}>
                          {highlightedDisplay}
                        </div>
                      )}
                    />
                  </MentionsInput>
                ) : (
                  <div className="mentions read-only">
                    {renderMentions(additionalPrompt)}
                  </div>
                )}
              </div>
              <button type="submit">
                {editingAssignmentId ? "Save" : "Add Assignment"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="cancel-button"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
