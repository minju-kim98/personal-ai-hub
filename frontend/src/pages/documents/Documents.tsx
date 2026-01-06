import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Upload,
  FileText,
  Folder,
  Search,
  MoreVertical,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn, formatDate } from "../../lib/utils";
import type { DocumentCategory, Document } from "../../types";
import { documentApi } from "../../services/api";

const categories: { value: DocumentCategory; label: string }[] = [
  { value: "resume", label: "이력서" },
  { value: "portfolio", label: "포트폴리오" },
  { value: "cover_letter", label: "자기소개서" },
  { value: "weekly_report", label: "주간보고서" },
  { value: "proposal", label: "기획서" },
  { value: "misc", label: "기타" },
];

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("resume");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { category?: string; search?: string } = {};
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const response = await documentApi.list(params);
      setDocuments(response.data.items || response.data || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      try {
        await documentApi.upload(acceptedFiles[0], uploadCategory);
        await fetchDocuments();
        alert("파일이 업로드되었습니다!");
      } catch (error) {
        console.error("Upload error:", error);
        alert("업로드에 실패했습니다.");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadCategory, fetchDocuments]
  );

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await documentApi.delete(id);
      await fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const response = await documentApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드에 실패했습니다.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">내 문서함</h1>
          <p className="text-muted-foreground mt-1">
            문서를 업로드하고 AI가 분석할 수 있도록 관리하세요
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">문서 업로드</CardTitle>
          <CardDescription>
            DOCX, PPTX, PDF, XLSX, MD 파일을 업로드할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <select
              value={uploadCategory}
              onChange={(e) =>
                setUploadCategory(e.target.value as DocumentCategory)
              }
              className="px-3 py-2 border rounded-md text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p>파일을 여기에 놓으세요</p>
            ) : isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>업로드 중...</p>
              </div>
            ) : (
              <>
                <p className="font-medium">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  최대 50MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            전체
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="문서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {doc.original_file_name}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="px-2 py-1 bg-secondary rounded text-xs">
                    {categories.find((c) => c.value === doc.category)?.label}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleDownload(doc.id, doc.original_file_name)}
                  >
                    <Download className="h-3 w-3" />
                    다운로드
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {documents.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "검색 결과가 없습니다"
                  : "아직 업로드된 문서가 없습니다"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
