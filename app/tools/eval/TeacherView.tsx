'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Question, Answer, updateQuestion, updateRubrics, fetchQuestionWithRubrics } from '@/utils/supabase/operations'
import { Trash2, BotIcon as Robot, User, Pencil, Check, X, Plus, Save, Trash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`

type TeacherViewProps = {
  questions: Question[];
  answers: Record<string, Answer>;
  addQuestion: (questionText: string, class_: string, score: number) => void;
  deleteQuestion: (id: string) => void;
  updateQuestionList: (updatedQuestion: Question) => void;
}

type Rubric = {
  name: string;
  points: number;
  description: string;
}

export default function TeacherView({ questions, answers, addQuestion, deleteQuestion, updateQuestionList }: TeacherViewProps) {
  const [newQuestion, setNewQuestion] = useState('')
  const [class_, setClass] = useState('')
  const [score, setScore] = useState('')
  const [isAI, setIsAI] = useState(true)
  const [rubrics, setRubrics] = useState<string>('')
  const [rubricsHuman, setRubricsHuman] = useState<string>('')
  const [originalRubrics, setOriginalRubrics] = useState<string>('')
  const [customRubrics, setCustomRubrics] = useState<Rubric[]>([])
  const [isGeneratingRubrics, setIsGeneratingRubrics] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editedValue, setEditedValue] = useState<string | number>('')
  const [editError, setEditError] = useState<string | null>(null)
  const [newRubric, setNewRubric] = useState<Rubric>({ name: '', points: 0, description: '' })
  const [editingRubrics, setEditingRubrics] = useState<string | null>(null)
  const [editedRubrics, setEditedRubrics] = useState<string>('')
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
  const [showCustomRubricForm, setShowCustomRubricForm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newQuestion.trim() && class_.trim() && score.trim()) {
      addQuestion(newQuestion.trim(), class_.trim(), parseInt(score.trim(), 10))
      setNewQuestion('')
      setClass('')
      setScore('')
    }
  }

  const generateRubrics = async (question: Question) => {
    setIsGeneratingRubrics(true)
    setRubrics('')
    setCustomRubrics([])
    try {
      const response = await fetch('/api/eval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.text,
          class: question.class,
          score: question.score,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setRubrics(data.rubrics)
      setOriginalRubrics(question.rubrics || '') // Set original rubrics to the current rubrics in the database
    } catch (error) {
      console.error('Error generating rubrics:', error)
      setRubrics('Error generating rubrics. Please try again later.')
    } finally {
      setIsGeneratingRubrics(false)
    }
  }

  const startEditing = (question: Question, field: 'text' | 'class' | 'score') => {
    setEditingQuestion(`${question.id}-${field}`)
    setEditedValue(question[field])
  }

  const handleEdit = async (question: Question, field: 'text' | 'class' | 'score') => {
    if (editedValue.toString().trim() === '') {
      setEditError('This field cannot be empty');
      return;
    }
    const updatedQuestion = await updateQuestion(question.id, { [field]: editedValue });
    if (updatedQuestion) {
      updateQuestionList(updatedQuestion);
    }
    setEditingQuestion(null);
    setEditError(null);
  }

  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditedValue('');
    setEditError(null);
  }

  const handleAddCustomRubric = () => {
    if (newRubric.name && newRubric.points > 0 && newRubric.description) {
      const newCustomRubrics = [...customRubrics, newRubric];
      setCustomRubrics(newCustomRubrics);
      const currentRubrics = isAI ? rubrics : rubricsHuman;
      const rubricNumber = currentRubrics ? currentRubrics.split('\n\n').length + 1 : 1;
      const updatedRubrics = currentRubrics + (currentRubrics ? '\n\n' : '') + 
        `Rubric ${rubricNumber}\n` +
        `${newRubric.name}\n${newRubric.points}\n${newRubric.description}`;
      if (isAI) {
        setRubrics(updatedRubrics);
      } else {
        setRubricsHuman(updatedRubrics);
      }
      setNewRubric({ name: '', points: 0, description: '' });
      setShowCustomRubricForm(false);
    }
  };

  const handleSaveRubrics = async (questionId: string) => {
    const currentRubrics = isAI ? rubrics : rubricsHuman;
    if (currentRubrics === originalRubrics) return;
    try {
      await updateRubrics(questionId, currentRubrics, !isAI);
      updateQuestionList({ ...questions.find(q => q.id === questionId)!, [isAI ? 'rubrics' : 'rubrics_human']: currentRubrics || null });
      setOriginalRubrics(currentRubrics);
    } catch (error) {
      console.error('Error saving rubrics:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const renderRubrics = () => {
    const currentRubrics = isAI ? rubrics : rubricsHuman;
    return (
      <>
        {editingRubrics === 'generated' ? (
          <div className="mb-4 flex flex-col h-full">
            <Textarea
              value={editedRubrics}
              onChange={(e) => setEditedRubrics(e.target.value)}
              className="flex-grow w-full mb-2 min-h-[300px]"
            />
            <div className="flex justify-end space-x-2 mt-2">
              <Button onClick={() => {
                if (isAI) {
                  setRubrics(editedRubrics);
                } else {
                  setRubricsHuman(editedRubrics);
                }
                setEditingRubrics(null);
              }}>
                <Check className="h-4 w-4 mr-2" />
                Update
              </Button>
              <Button variant="outline" onClick={() => setEditingRubrics(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-4 relative">
            {currentRubrics ? (
              <pre className="whitespace-pre-wrap">{currentRubrics}</pre>
            ) : (
              <p className="text-gray-500 italic">No rubrics available</p>
            )}
            <div className="absolute top-0 right-0 space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingRubrics('generated');
                  setEditedRubrics(currentRubrics);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isAI) {
                    setRubrics('');
                  } else {
                    setRubricsHuman('');
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderHumanRubricForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rubricName">Rubric Name</Label>
        <Input
          id="rubricName"
          value={newRubric.name}
          onChange={(e) => setNewRubric({...newRubric, name: e.target.value})}
          placeholder="Enter rubric name"
        />
      </div>
      <div>
        <Label htmlFor="rubricPoints">Points</Label>
        <Input
          id="rubricPoints"
          type="number"
          value={newRubric.points}
          onChange={(e) => setNewRubric({...newRubric, points: Number(e.target.value)})}
          placeholder="Enter points"
        />
      </div>
      <div>
        <Label htmlFor="rubricDescription">Description</Label>
        <Textarea
          id="rubricDescription"
          value={newRubric.description}
          onChange={(e) => setNewRubric({...newRubric, description: e.target.value})}
          placeholder="Enter rubric description"
        />
      </div>
      <div className="flex justify-between items-center">
        <Button onClick={handleAddCustomRubric}>Add Rubric</Button>
        <Button
          onClick={() => handleSaveRubrics(currentQuestionId!)}
          disabled={rubricsHuman.trim() === originalRubrics.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Rubrics
        </Button>
      </div>
    </div>
  );

  const renderCustomRubricForm = () => (
    <div className="space-y-4 mt-4 p-4 bg-gray-100 rounded-md">
      <h4 className="font-semibold">Add Custom Rubric</h4>
      <div>
        <Label htmlFor="rubricName">Rubric Name</Label>
        <Input
          id="rubricName"
          value={newRubric.name}
          onChange={(e) => setNewRubric({...newRubric, name: e.target.value})}
          placeholder="Enter rubric name"
        />
      </div>
      <div>
        <Label htmlFor="rubricPoints">Points</Label>
        <Input
          id="rubricPoints"
          type="number"
          value={newRubric.points}
          onChange={(e) => setNewRubric({...newRubric, points: Number(e.target.value)})}
          placeholder="Enter points"
        />
      </div>
      <div>
        <Label htmlFor="rubricDescription">Description</Label>
        <Textarea
          id="rubricDescription"
          value={newRubric.description}
          onChange={(e) => setNewRubric({...newRubric, description: e.target.value})}
          placeholder="Enter rubric description"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button onClick={handleAddCustomRubric}>Add Rubric</Button>
        <Button variant="outline" onClick={() => setShowCustomRubricForm(false)}>Cancel</Button>
      </div>
    </div>
  );

  useEffect(() => {
    if (currentQuestionId) {
      const fetchRubrics = async () => {
        const questionWithRubrics = await fetchQuestionWithRubrics(currentQuestionId);
        if (questionWithRubrics) {
          setRubrics(questionWithRubrics.rubrics || '');
          setRubricsHuman(questionWithRubrics.rubrics_human || '');
          setOriginalRubrics(isAI ? (questionWithRubrics.rubrics || '') : (questionWithRubrics.rubrics_human || ''));
        }
      };
      fetchRubrics();
    }
  }, [currentQuestionId, isAI]);

  return (
    <div>
      <style jsx global>{scrollbarStyles}</style>
      <h2 className="text-2xl font-bold mb-4">Teacher View</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <Label htmlFor="question">Question</Label>
          <Input
            id="question"
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Enter a new question"
            className="w-full"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="class">Class</Label>
            <Input
              id="class"
              type="text"
              value={class_}
              onChange={(e) => setClass(e.target.value)}
              placeholder="Enter class"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="score">Score</Label>
            <Input
              id="score"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter score"
            />
          </div>
        </div>
        <Button type="submit">Add Question</Button>
      </form>
      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-bold flex items-center">
                {editingQuestion === `${question.id}-text` ? (
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Input
                        value={editedValue}
                        onChange={(e) => setEditedValue(e.target.value)}
                        className="mr-2"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(question, 'text')}
                        className="mr-1"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {editError && <p className="text-red-500 text-sm mt-1">{editError}</p>}
                  </div>
                ) : (
                  <>
                    {question.text}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(question, 'text')}
                      className="ml-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardTitle>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setCurrentQuestionId(question.id);
                        if (question.rubrics) {
                          setRubrics(question.rubrics);
                          setOriginalRubrics(question.rubrics);
                        } else {
                          setRubrics('');
                          setOriginalRubrics('');
                        }
                        if (question.rubrics_human) {
                          setRubricsHuman(question.rubrics_human);
                          setOriginalRubrics(question.rubrics_human);
                        } else {
                          setRubricsHuman('');
                          setOriginalRubrics('');
                        }
                        setCustomRubrics([]);
                        setShowCustomRubricForm(false);
                      }}
                    >
                      📋 Set Evaluation Metrics
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto custom-scrollbar" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>Evaluation Assistant</DialogTitle>
                      <DialogDescription>
                        Choose between AI and human evaluation for this question.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center mt-4">
                      <div className="flex items-center space-x-2">
                        <User className={`h-5 w-5 ${!isAI ? 'text-primary' : 'text-gray-400'}`} />
                        <Switch
                          checked={isAI}
                          onCheckedChange={setIsAI}
                          className="data-[state=checked]:bg-primary"
                        />
                        <Robot className={`h-5 w-5 ${isAI ? 'text-primary' : 'text-gray-400'}`} />
                      </div>
                      <p className="mt-2 text-sm text-center">
                        {isAI ? "AI-powered evaluation activated" : "Human evaluation mode"}
                      </p>
                    </div>
                    <div className="mt-4">
                      <p>Evaluation for question: {question.text}</p>
                      {isAI ? (
                        <div className="flex space-x-2 mt-2">
                          <Button 
                            onClick={() => generateRubrics(question)} 
                            disabled={isGeneratingRubrics}
                          >
                            {isGeneratingRubrics ? 'Generating...' : 'AI Suggested Rubrics'}
                          </Button>
                          <Button
                            onClick={() => handleSaveRubrics(question.id)}
                            disabled={rubrics === originalRubrics}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Rubrics
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleSaveRubrics(question.id)}
                          disabled={rubricsHuman === originalRubrics}
                          className="mt-2"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Rubrics
                        </Button>
                      )}
                      {((isAI && rubrics) || (!isAI && rubricsHuman)) && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Rubrics:</h4>
                          </div>
                          {renderRubrics()}
                        </div>
                      )}
                      {showCustomRubricForm ? (
                        renderCustomRubricForm()
                      ) : (
                        <Button
                          onClick={() => setShowCustomRubricForm(true)}
                          className="mt-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Rubric
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    Class: 
                    {editingQuestion === `${question.id}-class` ? (
                      <div className="flex flex-col">
                        <div className="flex items-center ml-2">
                          <Input
                            value={editedValue}
                            onChange={(e) => setEditedValue(e.target.value)}
                            className="w-24 mr-2"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(question, 'class')}
                            className="mr-1"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {editError && <p className="text-red-500 text-sm mt-1">{editError}</p>}
                      </div>
                    ) : (
                      <>
                        {question.class}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(question, 'class')}
                          className="ml-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </span>
                  <span className="flex items-center">
                    Total Score: 
                    {editingQuestion === `${question.id}-score` ? (
                      <div className="flex flex-col">
                        <div className="flex items-center ml-2">
                          <Input
                            type="number"
                            value={editedValue}
                            onChange={(e) => setEditedValue(parseInt(e.target.value, 10))}
                            className="w-24 mr-2"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(question, 'score')}
                            className="mr-1"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {editError && <p className="text-red-500 text-sm mt-1">{editError}</p>}
                      </div>
                    ) : (
                      <>
                        {question.score}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(question, 'score')}
                          className="ml-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex flex-col items-end mt-2">
                  {answers[question.id] ? (
                    <>
                      {answers[question.id].human_obtained_score && (
                        <span className="flex items-center mb-1">
                          Human Evaluation: {answers[question.id].human_obtained_score}/{question.score}
                        </span>
                      )}
                      {(answers[question.id].ai_obtained_score || answers[question.id].self_score) && (
                        <span className="flex items-center">
                          AI Evaluation: {answers[question.id].ai_obtained_score || answers[question.id].self_score}/{question.score}
                        </span>
                      )}
                      {!answers[question.id].human_obtained_score && !answers[question.id].ai_obtained_score && !answers[question.id].self_score && (
                        <span>Score: N/A</span>
                      )}
                    </>
                  ) : (
                    <span>Score: N/A</span>
                  )}
                </div>
              </div>
              {answers[question.id] ? (
                <div className="mt-2">
                  <h4 className="font-semibold mb-2">Student's answer:</h4>
                  <p className="bg-gray-100 p-3 rounded">{answers[question.id].text}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic mt-2">No answer submitted yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

