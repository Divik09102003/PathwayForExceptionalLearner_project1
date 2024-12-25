"use client";

import { useState, useEffect } from "react";
import type { Assignment } from "@prisma/client";
import { CaretRightIcon, GridIcon, ListBulletIcon } from "@radix-ui/react-icons";
import { Container, Flex, Heading, Box, Card, Text } from "@radix-ui/themes";
import styles from "./page.module.css";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function AssignmentCard({ assignment, isListView }: { assignment: Assignment; isListView: boolean }) {
  if (isListView) {
    return (
      <Link href={`/assignment/${assignment.id}`}>
        <Card 
          size="1" 
          className={`${styles.listAssignmentCard} 
                    transition-all 
                    dark:bg-gray-800 dark:text-white
                    hover:dark:bg-gray-700`}
        >
          <Flex gap="3" align="center" p="2" justify="between">
            <Flex gap="3" align="center" style={{ flex: 1 }}>
              <div className={`${styles.customAvatar} dark:bg-blue-300 dark:text-white`}>
                {assignment.subject[0] || "A"}
              </div>
              <Box className="flex-1">
                <Text as="div" size="2" weight="bold" style={{ marginBottom: '-2px' }}>
                  {assignment.title}
                </Text>
                <Text as="div" size="2" color="gray" style={{ lineHeight: '1.2' }}>
                  {assignment.subject} &middot; Updated {new Date(assignment.updatedAt).toDateString()}
                </Text>
              </Box>
            </Flex>
            <CaretRightIcon height={24} width={24} className="dark:text-blue-300" />
          </Flex>
        </Card>
      </Link>
    );
  } else {
    return (
      <Card className={`${styles.customCard} 
                    dark:bg-gray-800 dark:text-white
                    transition-all 
                    hover:dark:bg-gray-700`}
      >
        <div className={`${styles.customAvatar} dark:bg-blue-300 dark:text-white`}>
          {assignment.subject[0] || "A"}
        </div>
        <div className={styles.cardContent}>
          <div className={styles.cardTitle}>{assignment.title}</div>
          <div className={styles.cardSubtitle}>
            Updated {new Date(assignment.updatedAt).toDateString()}
          </div>
        </div>
        <div className={styles.cardActions}>
          <Link href={`/assignment/${assignment.id}`} className={`${styles.assignmentsLink} dark:text-blue-300`}>
            View Details
          </Link>
        </div>
      </Card>
    );
  }
}

export default function AssignmentListPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isListView, setIsListView] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetch("/api/assignment")
      .then((res) => res.json())
      .then((data) => setAssignments(data))
      .catch(console.error);

    const storedView = localStorage.getItem('studentListView'); // Changed key
    if (storedView !== null) {
      setIsListView(storedView === 'true');
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('studentListView', isListView.toString()); // Changed key
    }
  }, [isListView, isMounted]);

  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const subj = assignment.subject;
    if (!acc[subj]) acc[subj] = [];
    acc[subj].push(assignment);
    return acc;
  }, {} as { [key: string]: Assignment[] });

  return (
    isMounted && (
      <div className={`${styles.assignmentPage} dark:bg-[#1F1F1F] dark:text-white`}>
        <div className={styles.assignmentContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Students</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Container className="p-8">
            <Flex align="center" justify="between" mb="4">
              <Heading as="h1" className="dark:text-white">Assignment List</Heading>
              <button 
                onClick={() => setIsListView(prev => !prev)} 
                className={`${styles.viewToggleButton} dark:hover:bg-transparent dark:text-white`}
                style={{ 
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s',
                }}>
                {isListView ? <ListBulletIcon width="24" height="24" /> : <GridIcon width="24" height="24" />}
              </button>
            </Flex>
            {Object.entries(groupedAssignments).map(([subj, subjectAssignments]) => (
              <div key={subj} className={styles.subjectSection}>
                <Heading as="h2" size="5" className="subjectHeading dark:text-white">{subj}</Heading>
                <div className={isListView ? styles.listContainer : styles.cardContainer}>
                  {subjectAssignments.map((assignment) => (
                    <AssignmentCard 
                      key={assignment.id} 
                      assignment={assignment} 
                      isListView={isListView}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Container>
        </div>
      </div>
    )
  );
}
