{
  "openapi": "3.0.0",
  "info": {
    "title": "SwiftPro REST API Docs",
    "version": "2.3.0",
    "description": "SwiftPro REST API docs for dev server - This docs is mainly for itegration and testing"
  },
  "servers": [
    {
      "url": "http://localhost:10001/api/v1/contract",
      "desription": "Local server testing"
    },
    {
      "url": "https://dev.swiftpro.tech/api/v1/dev/contract",
      "description": "Development server for testing and integration"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "CreateContractInput": {
        "type": "object",
        "required": [
          "title",
          "description",
          "category",
          "timezone",
          "contractType",
          "contractRelationship",
          "rating"
        ],
        "properties": {
          "projectId": {
            "type": "string",
            "description": "Project ID when contractRelationship is 'project'"
          },
          "status": {
            "type": "string",
            "enum": [
              "draft",
              "publish"
            ],
            "description": "Contract status on creation (default publish)"
          },
          "msaContractId": {
            "type": "string",
            "description": "MSA Contract ID when contractRelationship is 'msa_project'"
          },
          "solicitationId": {
            "type": "string",
            "description": "Link to an awarded solicitation"
          },
          "businessDivision": {
            "type": "string",
            "description": "Business division ID"
          },
          "contractType": {
            "type": "string",
            "description": "Contract type ID"
          },
          "timezone": {
            "type": "string"
          },
          "contractPaymentTerm": {
            "type": "string",
            "description": "Contract payment term ID"
          },
          "contractTermType": {
            "type": "string",
            "description": "Contract term type ID"
          },
          "title": {
            "type": "string"
          },
          "contractRelationship": {
            "type": "string",
            "enum": [
              "standalone",
              "project",
              "msa_project"
            ]
          },
          "category": {
            "type": "string"
          },
          "contractId": {
            "type": "string",
            "description": "Optional external ID"
          },
          "description": {
            "type": "string"
          },
          "jobTitle": {
            "type": "string"
          },
          "rating": {
            "type": "number",
            "minimum": 1,
            "maximum": 10
          },
          "vendor": {
            "type": "string",
            "description": "Vendor ObjectId or email"
          },
          "personnel": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "role": {
                  "type": "string"
                },
                "email": {
                  "type": "string",
                  "format": "email"
                },
                "phone": {
                  "type": "string"
                }
              }
            }
          },
          "internalTeam": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "List of internal user IDs"
          },
          "visibility": {
            "type": "string",
            "enum": [
              "public",
              "private"
            ],
            "default": "private"
          },
          "contractAmount": {
            "type": "number"
          },
          "contigency": {
            "type": "string"
          },
          "holdBack": {
            "type": "number"
          },
          "paymentTerm": {
            "type": "string"
          },
          "paymentStructure": {
            "type": "string",
            "enum": [
              "Monthly",
              "Milestone",
              "Progress Draw"
            ],
            "description": "Payment arrangement for the contract"
          },
          "startDate": {
            "type": "string",
            "format": "date-time"
          },
          "endDate": {
            "type": "string",
            "format": "date-time"
          },
          "duration": {
            "type": "number"
          },
          "termType": {
            "type": "string"
          },
          "contractFormationStage": {
            "type": "object",
            "properties": {
              "draft": {
                "type": "object",
                "properties": {
                  "startDate": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "endDate": {
                    "type": "string",
                    "format": "date-time"
                  }
                }
              },
              "review": {
                "type": "object",
                "properties": {
                  "startDate": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "endDate": {
                    "type": "string",
                    "format": "date-time"
                  }
                }
              },
              "approval": {
                "type": "object",
                "properties": {
                  "startDate": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "endDate": {
                    "type": "string",
                    "format": "date-time"
                  }
                }
              },
              "execution": {
                "type": "object",
                "properties": {
                  "startDate": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "endDate": {
                    "type": "string",
                    "format": "date-time"
                  }
                }
              }
            }
          },
          "deliverable": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "dueDate": {
                "type": "string",
                "format": "date"
              }
            }
          },
          "deliverables": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "dueDate": {
                  "type": "string",
                  "format": "date-time"
                }
              }
            }
          },
          "insurance": {
            "type": "object",
            "properties": {
              "insurance": {
                "type": "string"
              },
              "contractSecurity": {
                "type": "boolean"
              },
              "contractSecurityType": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "securityType": {
                      "type": "string"
                    },
                    "amount": {
                      "type": "number"
                    },
                    "dueDate": {
                      "type": "string",
                      "format": "date-time"
                    }
                  }
                }
              },
              "expiryDate": {
                "type": "string",
                "format": "date-time"
              },
              "policy": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "policyName": {
                      "type": "string"
                    },
                    "limit": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "milestone": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "amount": {
                  "type": "number"
                },
                "dueDate": {
                  "type": "string",
                  "format": "date-time"
                },
                "name": {
                  "type": "string"
                },
                "deliverable": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "dueDate": {
                      "type": "string",
                      "format": "date-time"
                    }
                  }
                }
              }
            }
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string",
                  "format": "uri"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "number"
                }
              }
            }
          },
          "approvaers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "user": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "groupName": {
                  "type": "string"
                },
                "levelName": {
                  "type": "number",
                  "minimum": 1,
                  "maximum": 5
                },
                "amount": {
                  "type": "number"
                }
              }
            }
          },
          "approvers": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "user": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "groupName": {
                  "type": "string"
                },
                "level": {
                  "type": "number"
                },
                "amount": {
                  "type": "number"
                }
              }
            }
          },
          "signatories": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "Contract": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "contractRelationship": {
            "type": "string",
            "enum": [
              "standalone",
              "project",
              "msa_project"
            ]
          },
          "status": {
            "type": "string",
            "enum": [
              "draft",
              "pending_approval",
              "active",
              "completed",
              "cancelled",
              "expired",
              "terminated"
            ]
          },
          "deliverables": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "dueDate": {
                  "type": "string",
                  "format": "date-time"
                }
              }
            }
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          },
          "signatories": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "approver": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          },
          "company": {
            "type": "string"
          },
          "project": {
            "type": "string"
          },
          "vendor": {
            "type": "string"
          },
          "creator": {
            "type": "string"
          },
          "contractType": {
            "type": "string",
            "enum": [
              "hourly",
              "fixed",
              "milestone"
            ]
          },
          "currency": {
            "type": "string",
            "example": "USD"
          },
          "ratePerHour": {
            "type": "number"
          },
          "totalAmount": {
            "type": "number"
          },
          "startDate": {
            "type": "string",
            "format": "date-time"
          },
          "endDate": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseContract": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Contract fetched successfully"
          },
          "data": {
            "$ref": "#/components/schemas/Contract"
          }
        }
      },
      "CreateProjectInput": {
        "type": "object",
        "required": [
          "name",
          "category",
          "description",
          "budget",
          "allowMultiple"
        ],
        "properties": {
          "name": {
            "type": "string",
            "description": "Project name",
            "example": "School Renovation"
          },
          "category": {
            "type": "string",
            "description": "Project category or domain",
            "example": "Education"
          },
          "description": {
            "type": "string",
            "description": "Detailed explanation of the project scope",
            "example": "Renovation of central school blocks"
          },
          "businessDivision": {
            "type": "string",
            "description": "Optional business division or department",
            "example": "Education"
          },
          "startDate": {
            "type": "string",
            "format": "date",
            "description": "Optional start date (ISO 8601)",
            "example": "2026-01-15"
          },
          "endDate": {
            "type": "string",
            "format": "date",
            "description": "Optional end date (ISO 8601)",
            "example": "2026-09-30"
          },
          "budget": {
            "type": "number",
            "description": "Allocated budget for the project",
            "example": 1200000
          },
          "allowMultiple": {
            "type": "boolean",
            "description": "Whether multiple contracts are allowed under this project",
            "example": true
          },
          "files": {
            "type": "array",
            "description": "Optional list of associated file metadata",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string",
                  "format": "uri"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "number"
                }
              }
            }
          }
        }
      },
      "Project": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "company": {
            "type": "string"
          },
          "businessDivision": {
            "type": "string"
          },
          "creator": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "startDate": {
            "type": "string",
            "format": "date-time"
          },
          "endDate": {
            "type": "string",
            "format": "date-time"
          },
          "budget": {
            "type": "number"
          },
          "status": {
            "type": "string",
            "enum": [
              "active",
              "completed",
              "cancelled"
            ]
          },
          "allowMultiple": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ApiResponseProject": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 201
          },
          "message": {
            "type": "string",
            "example": "Project created successfully"
          },
          "data": {
            "$ref": "#/components/schemas/Project"
          }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "example": "error"
          },
          "message": {
            "type": "string",
            "example": "Something went wrong"
          }
        }
      },
      "ApiResponseProjectList": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Projects fetched successfully"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Project"
            }
          }
        }
      },
      "ProjectStats": {
        "type": "object",
        "properties": {
          "all": {
            "type": "number"
          },
          "active": {
            "type": "number"
          },
          "completed": {
            "type": "number"
          },
          "cancelled": {
            "type": "number"
          }
        }
      },
      "ApiResponseProjectStats": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Project stats fetched successfully"
          },
          "data": {
            "$ref": "#/components/schemas/ProjectStats"
          }
        }
      },
      "ApiResponseContractList": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Project contracts fetched successfully"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Contract"
            }
          }
        }
      },
      "AuthenticatedError": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 401
          },
          "message": {
            "type": "string",
            "example": "User not authenticated"
          }
        }
      },
      "NotFoundError": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 404
          },
          "message": {
            "type": "string",
            "example": "Not Found"
          }
        }
      },
      "DuplicateError": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 409
          },
          "message": {
            "type": "string",
            "example": "Duplicate entry"
          }
        }
      },
      "ValidationError": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 422
          },
          "message": {
            "type": "string",
            "example": "Validation failed"
          }
        }
      },
      "ServerError": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 500
          },
          "message": {
            "type": "string",
            "example": "Internal server error"
          }
        }
      },
      "AuthorizeError": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 403
          },
          "message": {
            "type": "string",
            "example": "Unauthorized"
          }
        }
      },
      "BadRequest": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 400
          },
          "message": {
            "type": "string",
            "example": "Bad request"
          }
        }
      },
      "ContractType": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "ContractPaymentTerm": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "ContractTermType": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "AwardedVendorItem": {
        "type": "object",
        "properties": {
          "solicitationId": {
            "type": "string"
          },
          "solicitationName": {
            "type": "string"
          },
          "vendor": {
            "type": "object",
            "properties": {
              "_id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "email": {
                "type": "string"
              }
            }
          }
        }
      },
      "UserBasic": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          }
        }
      },
      "ApiResponseContractTypeList": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Contract types fetched successfully"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContractType"
            }
          }
        }
      },
      "ApiResponseContractPaymentTermList": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Contract payment terms fetched successfully"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContractPaymentTerm"
            }
          }
        }
      },
      "ApiResponseContractTermTypeList": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Contract terms fetched successfully"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContractTermType"
            }
          }
        }
      },
      "ApiResponseAwardedVendorList": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Awarded solicitation vendors fetched successfully"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AwardedVendorItem"
            }
          }
        }
      },
      "ApiResponseUserList": {
        "type": "object",
        "properties": {
          "status": {
            "type": "number",
            "example": 200
          },
          "message": {
            "type": "string",
            "example": "Contract personnel fetched successfully"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/UserBasic"
            }
          }
        }
      },
      "ContractRfiDTO": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "deadline": {
            "type": "string",
            "format": "date-time"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "ContractRfiResponseDTO": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "ContractLemDTO": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "amount": {
            "type": "number"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "ContractChangeApprover": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "level": {
            "type": "number"
          },
          "amount": {
            "type": "number"
          },
          "group": {
            "type": "string"
          },
          "levelStatus": {
            "type": "string",
            "enum": [
              "pending",
              "approved",
              "rejected"
            ]
          },
          "completedAt": {
            "type": "string",
            "format": "date-time"
          },
          "user": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "_id": {
                  "type": "string"
                },
                "user": {
                  "type": "string"
                },
                "status": {
                  "type": "string",
                  "enum": [
                    "pending",
                    "approved",
                    "rejected"
                  ]
                },
                "comment": {
                  "type": "string"
                },
                "actionedAt": {
                  "type": "string",
                  "format": "date-time"
                }
              }
            }
          }
        }
      },
      "ContractHoldBackDTO": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "number"
          },
          "type": {
            "type": "string",
            "enum": [
              "partial",
              "full"
            ]
          },
          "invoiceId": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "number"
                }
              }
            }
          }
        }
      },
      "ContractSavingDTO": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "number"
          },
          "title": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "number"
                }
              }
            }
          }
        }
      },
      "ContractChange": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "proposalCategory": {
            "type": "string"
          },
          "urgency": {
            "type": "string",
            "enum": [
              "low",
              "medium",
              "high"
            ]
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "number"
                }
              }
            }
          }
        }
      },
      "ContractChangeManagerDTO": {
        "allOf": [
          {
            "$ref": "#/components/schemas/ContractChange"
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "directive",
                  "proposal"
                ]
              }
            }
          }
        ]
      },
      "ContractChangeDTO": {
        "allOf": [
          {
            "$ref": "#/components/schemas/ContractChange"
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "request",
                  "directive",
                  "proposal",
                  "order"
                ]
              }
            }
          }
        ]
      },
      "ApprovalActionDTO": {
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": [
              "approved",
              "rejected"
            ]
          },
          "comment": {
            "type": "string"
          }
        }
      },
      "ContractChangeCommentDTO": {
        "type": "object",
        "properties": {
          "content": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "ContractChangeReplyDTO": {
        "type": "object",
        "properties": {
          "parentCommentId": {
            "type": "string"
          },
          "content": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "ContractCommentDTO": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "contract": {
            "type": "string"
          },
          "commentRef": {
            "type": "string"
          },
          "commentRefModel": {
            "type": "string"
          },
          "company": {
            "type": "string"
          },
          "user": {
            "type": "object",
            "properties": {
              "_id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "email": {
                "type": "string"
              },
              "role": {
                "type": "object",
                "properties": {
                  "_id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "replyTo": {
            "type": "object",
            "properties": {
              "_id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "email": {
                "type": "string"
              }
            }
          },
          "parent": {
            "type": "string"
          },
          "content": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                },
                "uploadedAt": {
                  "type": "string",
                  "format": "date-time"
                }
              }
            }
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContractCommentDTO"
            }
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ContractClaimDTO": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "claimId": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "under review",
              "approved",
              "rejected",
              "dispute"
            ]
          },
          "type": {
            "type": "string"
          },
          "impact": {
            "type": "string",
            "enum": [
              "time",
              "cost",
              "time_cost"
            ]
          },
          "time": {
            "type": "number"
          },
          "cost": {
            "type": "number"
          },
          "descrption": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          },
          "manager": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string"
              },
              "comment": {
                "type": "string"
              }
            }
          },
          "approvers": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContractChangeApprover"
            }
          }
        }
      },
      "ContractInvoiceDTO": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "invoiceId": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "progress draw",
              "monthly payment",
              "milestone payment"
            ]
          },
          "taxCode": {
            "type": "string"
          },
          "taxValue": {
            "type": "number"
          },
          "description": {
            "type": "string"
          },
          "inputType": {
            "type": "string",
            "enum": [
              "manual",
              "file"
            ]
          },
          "amount": {
            "type": "number"
          },
          "status": {
            "type": "string",
            "enum": [
              "pending",
              "approved",
              "rejected",
              "draft"
            ]
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "size": {
                  "type": "string"
                }
              }
            }
          },
          "manager": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string"
              },
              "comment": {
                "type": "string"
              }
            }
          },
          "approvers": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContractChangeApprover"
            }
          }
        }
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "paths": {
    "/approver/contract/stats": {
      "get": {
        "summary": "Get contract statistics",
        "description": "Returns statistics of contracts for the authenticated approver's company",
        "tags": [
          "Approver - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Contract statistics fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract": {
      "get": {
        "summary": "List contracts",
        "description": "Returns a list of contracts with pagination and filtering options",
        "tags": [
          "Approver - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Number of items per page"
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string"
            },
            "description": "Filter by contract status"
          },
          {
            "in": "query",
            "name": "category",
            "schema": {
              "type": "string"
            },
            "description": "Filter by contract category"
          },
          {
            "in": "query",
            "name": "date",
            "schema": {
              "type": "string",
              "format": "date"
            },
            "description": "Filter by date"
          }
        ],
        "responses": {
          "200": {
            "description": "Contracts fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/IContract"
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}": {
      "get": {
        "summary": "Get a contract by ID",
        "description": "Returns details of a specific contract",
        "tags": [
          "Approver - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/IContract"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Contract not found"
          }
        }
      }
    },
    "/approver/contract/{contractId}/approve/status": {
      "get": {
        "summary": "Check if contract can be approved",
        "description": "Checks if the current user can approve the contract at the current level",
        "tags": [
          "Approver - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract approve status fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/approve": {
      "post": {
        "summary": "Approve or reject a contract",
        "description": "Submit an approval action (approve/reject) for the contract",
        "tags": [
          "Approver - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "action"
                ],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": [
                      "approved",
                      "rejected"
                    ]
                  },
                  "comment": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract approval status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/IContract"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/change/stats": {
      "get": {
        "summary": "Get contract change statistics",
        "description": "Returns statistics of changes for a specific contract",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change statistics fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/change": {
      "get": {
        "summary": "List contract changes",
        "description": "Returns a list of changes for a specific contract with pagination and filtering",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Number of items per page"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by change type"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract changes fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/IContractChange"
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/change/{changeId}": {
      "get": {
        "summary": "Get a contract change by ID",
        "description": "Returns details of a specific contract change",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/IContractChange"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/change/{changeId}/comment": {
      "get": {
        "summary": "Get comments for a contract change",
        "description": "Returns a list of comments for a specific contract change",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Add a comment to a contract change",
        "description": "Adds a new comment to a specific contract change",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Change ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content"
                ],
                "properties": {
                  "content": {
                    "type": "string"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract change comment added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/change/{changeId}/comment/{commentId}/reply": {
      "post": {
        "summary": "Reply to a contract change comment",
        "description": "Adds a reply to a specific comment on a contract change",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Change ID"
          },
          {
            "in": "path",
            "name": "commentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Comment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content",
                  "parentCommentId"
                ],
                "properties": {
                  "content": {
                    "type": "string"
                  },
                  "parentCommentId": {
                    "type": "string"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract change reply added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/change/{changeId}/approve/status": {
      "get": {
        "summary": "Check if contract change can be approved",
        "description": "Checks if the current user can approve the contract change at the current level",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Approval status checked successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/change/{changeId}/approve": {
      "post": {
        "summary": "Approve or reject a contract change",
        "description": "Submit an approval action (approve/reject) for the contract change",
        "tags": [
          "Approver - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Change ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "action"
                ],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": [
                      "approved",
                      "rejected"
                    ]
                  },
                  "comment": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract change approved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/IContractChange"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/claim/stats": {
      "get": {
        "summary": "Get contract claim statistics",
        "description": "Returns statistics of claims for a specific contract",
        "tags": [
          "Approver - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim statistics fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/claim": {
      "get": {
        "summary": "List contract claims",
        "description": "Returns a list of claims for a specific contract with pagination and filtering",
        "tags": [
          "Approver - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Number of items per page"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by claim type"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claims fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/IContractClaim"
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/claim/{claimId}": {
      "get": {
        "summary": "Get a contract claim by ID",
        "description": "Returns details of a specific contract claim",
        "tags": [
          "Approver - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/IContractClaim"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Contract claim not found"
          }
        }
      }
    },
    "/approver/contract/{contractId}/claim/{claimId}/comment": {
      "get": {
        "summary": "Get comments for a contract claim",
        "description": "Returns a list of comments for a specific contract claim",
        "tags": [
          "Approver - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Add a comment to a contract claim",
        "description": "Adds a new comment to a specific contract claim",
        "tags": [
          "Approver - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Claim ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content"
                ],
                "properties": {
                  "content": {
                    "type": "string"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract claim comment added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/claim/{claimId}/comment/{commentId}/reply": {
      "post": {
        "summary": "Reply to a contract claim comment",
        "description": "Adds a reply to a specific comment on a contract claim",
        "tags": [
          "Approver - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Claim ID"
          },
          {
            "in": "path",
            "name": "commentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Comment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content"
                ],
                "properties": {
                  "content": {
                    "type": "string"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract claim reply added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/claim/{claimId}/approve": {
      "post": {
        "summary": "Approve or reject a contract claim",
        "description": "Submit an approval action (approve/reject) for the contract claim",
        "tags": [
          "Approver - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Claim ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "action"
                ],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": [
                      "approved",
                      "rejected"
                    ]
                  },
                  "comment": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract claim action updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/IContractClaim"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/invoice/stats": {
      "get": {
        "summary": "Get contract invoice statistics",
        "description": "Returns statistics for invoices associated with a specific contract",
        "tags": [
          "Approver - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice statistics fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/invoice": {
      "get": {
        "summary": "List contract invoices",
        "description": "Returns a paginated list of invoices for a specific contract",
        "tags": [
          "Approver - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "query",
            "name": "invoiceId",
            "schema": {
              "type": "string"
            },
            "description": "Filter by invoice ID"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by invoice type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoices fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/invoice/{invoiceId}": {
      "get": {
        "summary": "Get contract invoice details",
        "description": "Returns detailed information for a specific contract invoice",
        "tags": [
          "Approver - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Invoice ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Contract invoice not found"
          }
        }
      }
    },
    "/approver/contract/{contractId}/invoice/{invoiceId}/approve/status": {
      "get": {
        "summary": "Check if contract invoice can be approved",
        "description": "Checks if the current user can approve the contract invoice at the current level",
        "tags": [
          "Approver - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Invoice ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Approval status checked successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/invoice/{invoiceId}/approve": {
      "post": {
        "summary": "Approve or reject a contract invoice",
        "description": "Submit an approval action (approve/reject) for the contract invoice",
        "tags": [
          "Approver - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Invoice ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "action"
                ],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": [
                      "approved",
                      "rejected"
                    ]
                  },
                  "comment": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract invoice approval status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/lem": {
      "get": {
        "summary": "List contract LEMs",
        "description": "Returns a paginated list of LEMs for a specific contract",
        "tags": [
          "Approver - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "query",
            "name": "lemId",
            "schema": {
              "type": "string"
            },
            "description": "Filter by LEM ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by title"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract LEMs fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/lem/{lemId}": {
      "get": {
        "summary": "Get contract LEM details",
        "description": "Returns detailed information for a specific contract LEM",
        "tags": [
          "Approver - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "lemId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "LEM ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract LEM fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Contract LEM not found"
          }
        }
      }
    },
    "/approver/contract/{contractId}/lem/{lemId}/approve/status": {
      "get": {
        "summary": "Check if contract LEM can be approved",
        "description": "Checks if the current user can approve the contract LEM at the current level",
        "tags": [
          "Approver - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "lemId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "LEM ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Approval status checked successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/lem/{lemId}/approve": {
      "post": {
        "summary": "Approve or reject a contract LEM",
        "description": "Submit an approval action (approve/reject) for the contract LEM",
        "tags": [
          "Approver - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "lemId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "LEM ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "action"
                ],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": [
                      "approved",
                      "rejected"
                    ]
                  },
                  "comment": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract LEM approval status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/approver/contract/{contractId}/amendment/stats": {
      "get": {
        "summary": "Get contract amendment statistics",
        "description": "Returns statistics for amendments associated with a specific contract.",
        "tags": [
          "Approver - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendment stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/approver/contract/{contractId}/amendment": {
      "get": {
        "summary": "List contract amendments",
        "description": "Returns a list of amendments for a specific contract.",
        "tags": [
          "Approver - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendments fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/approver/contract/{contractId}/amendment/{amendmentId}": {
      "get": {
        "summary": "Get contract amendment details",
        "description": "Returns detailed information for a specific contract amendment.",
        "tags": [
          "Approver - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract amendment ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendment fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract amendment not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/approver/contract/{contractId}/amendment/{amendmentId}/approve/status": {
      "get": {
        "summary": "Check if contract amendment can be approved",
        "description": "Checks if the current user can approve the contract amendment at the current level.",
        "tags": [
          "Approver - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract amendment ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendment approval status fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment approval status fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract amendment not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/approver/contract/{contractId}/amendment/{amendmentId}/approve": {
      "post": {
        "summary": "Approve or reject a contract amendment",
        "description": "Submit an approval action (approve/reject) for the contract amendment.",
        "tags": [
          "Approver - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract amendment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "action"
                ],
                "properties": {
                  "action": {
                    "type": "string",
                    "enum": [
                      "approved",
                      "rejected"
                    ],
                    "description": "Approval action"
                  },
                  "comment": {
                    "type": "string",
                    "description": "Optional comment"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract amendment approved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment approved successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract amendment not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/manager/business-division": {
      "post": {
        "summary": "Create a new business division",
        "description": "Creates a business division within the authenticated user's company.",
        "tags": [
          "Business Division"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "location"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "location": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Business division created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "_id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "location": {
                          "type": "string"
                        },
                        "company": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "500": {
            "description": "Server error"
          }
        }
      },
      "get": {
        "summary": "List business divisions",
        "description": "Returns a paginated list of business divisions.",
        "tags": [
          "Business Division"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Page size"
          },
          {
            "in": "query",
            "name": "search",
            "schema": {
              "type": "string"
            },
            "description": "Search by name or location"
          }
        ],
        "responses": {
          "200": {
            "description": "Business divisions fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "_id": {
                                "type": "string"
                              },
                              "name": {
                                "type": "string"
                              },
                              "location": {
                                "type": "string"
                              },
                              "totalProjects": {
                                "type": "integer"
                              },
                              "totalContracts": {
                                "type": "integer"
                              },
                              "totalProjectValue": {
                                "type": "number"
                              },
                              "totalContractValue": {
                                "type": "number"
                              }
                            }
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/manager/business-division/stats": {
      "get": {
        "summary": "Get business division stats",
        "description": "Returns statistics for business divisions.",
        "tags": [
          "Business Division"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Business division stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "totalDivisions": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/manager/business-division/{divisionId}": {
      "get": {
        "summary": "Get a business division by ID",
        "description": "Returns details of a specific business division.",
        "tags": [
          "Business Division"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "divisionId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Business Division ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Business division fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "_id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "location": {
                          "type": "string"
                        },
                        "totalProjects": {
                          "type": "integer"
                        },
                        "totalContracts": {
                          "type": "integer"
                        },
                        "totalProjectValue": {
                          "type": "number"
                        },
                        "totalContractValue": {
                          "type": "number"
                        },
                        "company": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Business Division not found"
          }
        }
      }
    },
    "/manager/projects": {
      "get": {
        "summary": "List projects",
        "description": "Returns projects belonging to the authenticated user's company. Supports filtering and pagination.",
        "tags": [
          "Project"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "query",
            "name": "name",
            "schema": {
              "type": "string",
              "enum": [
                "draft",
                "pending_approval",
                "active",
                "completed",
                "suspended",
                "expired",
                "terminated"
              ]
            },
            "description": "Case-insensitive partial match by project name"
          },
          {
            "in": "query",
            "name": "date",
            "schema": {
              "type": "string",
              "format": "date"
            },
            "description": "Return projects having `startDate \u003E= date` (ISO 8601)"
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "format": "date",
              "enum": [
                "active",
                "completed",
                "cancelled"
              ]
            },
            "description": "Filter by project status"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 10
            },
            "description": "Page size"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1
            },
            "description": "Page number"
          }
        ],
        "responses": {
          "200": {
            "description": "Projects fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseProjectList"
                },
                "examples": {
                  "list": {
                    "value": {
                      "status": 200,
                      "message": "Projects fetched successfully",
                      "data": [
                        {
                          "_id": "671c2f0d9f4e2b0012345678",
                          "company": "66fb1c7a8d2eaa0012345678",
                          "creator": "66fb1c7a8d2eaa0098765432",
                          "name": "School Renovation",
                          "category": "Education",
                          "description": "Renovation of central school blocks",
                          "startDate": "2026-01-15T00:00:00.000Z",
                          "endDate": "2026-09-30T00:00:00.000Z",
                          "budget": 1200000,
                          "status": "active",
                          "allowMultiple": true,
                          "createdAt": "2026-01-01T10:30:22.000Z",
                          "updatedAt": "2026-01-01T10:30:22.000Z"
                        },
                        {
                          "_id": "671c2f0d9f4e2b0099999999",
                          "company": "66fb1c7a8d2eaa0012345678",
                          "creator": "66fb1c7a8d2eaa0098765432",
                          "name": "New Municipality Road",
                          "category": "Infrastructure",
                          "description": "Road construction in district A",
                          "startDate": "2026-02-01T00:00:00.000Z",
                          "budget": 2500000,
                          "status": "active",
                          "allowMultiple": false,
                          "createdAt": "2026-02-01T09:10:00.000Z",
                          "updatedAt": "2026-02-01T09:10:00.000Z"
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create a new project",
        "description": "Creates a project within the authenticated user's company. Only `procurement` and `contract_manager` roles are allowed.",
        "tags": [
          "Project"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "procurement",
          "contract_manager"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateProjectInput"
              },
              "examples": {
                "basic": {
                  "summary": "Minimal valid project",
                  "value": {
                    "name": "New Municipality Road",
                    "category": "Infrastructure",
                    "description": "Road construction in district A",
                    "budget": 2500000,
                    "allowMultiple": false
                  }
                },
                "withDates": {
                  "summary": "Project with start and end dates",
                  "value": {
                    "name": "School Renovation",
                    "category": "Education",
                    "description": "Renovation of central school blocks",
                    "startDate": "2026-01-15",
                    "endDate": "2026-09-30",
                    "budget": 1200000,
                    "allowMultiple": true
                  }
                },
                "withFiles": {
                  "summary": "Project payload including files metadata",
                  "value": {
                    "name": "Bridge Maintenance",
                    "category": "Infrastructure",
                    "description": "Routine maintenance and inspection",
                    "budget": 500000,
                    "allowMultiple": false,
                    "files": [
                      {
                        "name": "specifications.pdf",
                        "url": "https://example.com/files/specifications.pdf",
                        "type": "application/pdf",
                        "size": 1048576
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Project created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseProject"
                },
                "examples": {
                  "created": {
                    "value": {
                      "status": 201,
                      "message": "Project created successfully",
                      "data": {
                        "_id": "671c2f0d9f4e2b0012345678",
                        "company": "66fb1c7a8d2eaa0012345678",
                        "creator": "66fb1c7a8d2eaa0098765432",
                        "name": "School Renovation",
                        "category": "Education",
                        "description": "Renovation of central school blocks",
                        "startDate": "2026-01-15T00:00:00.000Z",
                        "endDate": "2026-09-30T00:00:00.000Z",
                        "budget": 1200000,
                        "status": "active",
                        "allowMultiple": true,
                        "createdAt": "2026-01-01T10:30:22.000Z",
                        "updatedAt": "2026-01-01T10:30:22.000Z"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                },
                "examples": {
                  "unauthenticated": {
                    "value": {
                      "status": "error",
                      "message": "Unauthenticated user"
                    }
                  }
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                },
                "examples": {
                  "forbidden": {
                    "value": {
                      "status": "error",
                      "message": "Access denied"
                    }
                  }
                }
              }
            }
          },
          "409": {
            "description": "Duplicate entry detected",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DuplicateError"
                },
                "examples": {
                  "duplicate": {
                    "value": {
                      "status": "error",
                      "message": "Duplicate entry: name with value \"School Renovation\" already exists"
                    }
                  }
                }
              }
            }
          },
          "422": {
            "description": "Validation error (zod/mongoose)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ValidationError"
                },
                "examples": {
                  "zod": {
                    "value": {
                      "status": "error",
                      "message": "Validation Error - name - Required. budget - Expected number."
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/types": {
      "get": {
        "summary": "List contract types",
        "description": "Returns all contract types available.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "responses": {
          "200": {
            "description": "Contract types fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseContractTypeList"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/payment-terms": {
      "get": {
        "summary": "List contract payment terms",
        "description": "Returns all supported contract payment terms.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "responses": {
          "200": {
            "description": "Contract payment terms fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseContractPaymentTermList"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/terms": {
      "get": {
        "summary": "List contract term types",
        "description": "Returns all contract term types.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "responses": {
          "200": {
            "description": "Contract terms fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseContractTermTypeList"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/awarded-solicitation": {
      "get": {
        "summary": "List awarded vendors without contracts",
        "description": "Returns awarded vendors for solicitations in the company that have not been linked to any contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "procurement",
          "contract_manager"
        ],
        "responses": {
          "200": {
            "description": "Awarded solicitation vendors fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseAwardedVendorList"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/personnel": {
      "get": {
        "summary": "List contract personnel",
        "description": "Returns users in the company eligible for contract-related roles.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "procurement",
          "contract_manager"
        ],
        "responses": {
          "200": {
            "description": "Contract personnel fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseUserList"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/msa-contract": {
      "get": {
        "summary": "List MSA contracts",
        "description": "Returns all MSA contracts for the company.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "procurement",
          "contract_manager"
        ],
        "responses": {
          "200": {
            "description": "MSA contracts fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ContractChangeApprover",
                        "properties": {
                          "_id": {
                            "type": "string"
                          },
                          "title": {
                            "type": "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user"
          },
          "403": {
            "description": "Forbidden – user lacks required role"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/manager/contracts": {
      "post": {
        "summary": "Create a new contract",
        "description": "Creates a contract within the authenticated user's company. Only `procurement` and `contract_manager` roles are allowed.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "procurement",
          "contract_manager"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateContractInput"
              },
              "examples": {
                "basic": {
                  "summary": "Minimal valid contract",
                  "value": {
                    "title": "Janitorial Services",
                    "description": "Routine office cleaning services",
                    "category": "Facilities",
                    "timezone": "America/New_York",
                    "status": "publish",
                    "paymentStructure": "Monthly",
                    "contractType": "671c2f0d9f4e2b0012345678",
                    "contractRelationship": "standalone",
                    "rating": 8,
                    "startDate": "2026-01-15",
                    "endDate": "2026-06-15",
                    "duration": 150,
                    "businessDivision": "671c2f0d9f4e2b0012345678"
                  }
                },
                "withProject": {
                  "summary": "Contract under a project",
                  "value": {
                    "title": "School Renovation Works",
                    "description": "Interior and exterior renovation",
                    "category": "Construction",
                    "timezone": "America/Chicago",
                    "status": "draft",
                    "paymentStructure": "Progress Draw",
                    "contractType": "671c2f0d9f4e2b0012345678",
                    "contractRelationship": "project",
                    "projectId": "66fb1c7a8d2eaa0012345678",
                    "rating": 7,
                    "businessDivision": "671c2f0d9f4e2b0012345678",
                    "contractFormationStage": {
                      "draft": {
                        "startDate": "2026-01-10",
                        "endDate": "2026-01-20"
                      }
                    }
                  }
                },
                "withVendorAndFiles": {
                  "summary": "Contract with vendor, deliverables, files",
                  "value": {
                    "title": "Bridge Inspection",
                    "description": "Routine inspection of municipal bridges",
                    "category": "Infrastructure",
                    "timezone": "America/Los_Angeles",
                    "status": "publish",
                    "paymentStructure": "Monthly",
                    "contractType": "671c2f0d9f4e2b0012345678",
                    "paymentTerm": "671c2f0d9f4e2b0099999999",
                    "contractRelationship": "standalone",
                    "rating": 9,
                    "businessDivision": "671c2f0d9f4e2b0012345678",
                    "vendor": "vendor@example.com",
                    "personnel": [
                      {
                        "name": "Jane Doe",
                        "role": "Supervisor",
                        "email": "jane.doe@example.com",
                        "phone": "+1-555-0101"
                      }
                    ],
                    "deliverables": [
                      {
                        "name": "Initial Report",
                        "dueDate": "2026-02-15"
                      }
                    ],
                    "files": [
                      {
                        "name": "scope.pdf",
                        "url": "https://example.com/scope.pdf",
                        "type": "application/pdf",
                        "size": 123456
                      }
                    ],
                    "internalTeam": [
                      "671c2f0d9f4e2b0012345678"
                    ],
                    "visibility": "private"
                  }
                },
                "withMilestone": {
                  "summary": "Contract with milestones (amount, due date, name)",
                  "value": {
                    "title": "Road Repair",
                    "description": "Patching and resurfacing",
                    "category": "Infrastructure",
                    "timezone": "America/New_York",
                    "status": "publish",
                    "contractType": "671c2f0d9f4e2b0012345678",
                    "paymentStructure": "Milestone",
                    "contractRelationship": "standalone",
                    "rating": 8,
                    "milestone": [
                      {
                        "amount": 250000,
                        "dueDate": "2026-03-01",
                        "name": "Phase 1 Completion"
                      },
                      {
                        "amount": 150000,
                        "dueDate": "2026-05-15",
                        "name": "Final Delivery"
                      }
                    ],
                    "insurance": {
                      "insurance": "General Liability",
                      "contractSecurity": true,
                      "contractSecurityType": [
                        {
                          "securityType": "Bond",
                          "amount": 50000,
                          "dueDate": "2026-02-15"
                        }
                      ],
                      "expiryDate": "2026-12-31",
                      "policy": [
                        {
                          "policyName": "Standard",
                          "limit": "1000000"
                        }
                      ]
                    }
                  }
                },
                "withApprovaers": {
                  "summary": "Contract with approvers (levels 1-5)",
                  "value": {
                    "title": "IT Equipment Supply",
                    "description": "Supply of laptops and accessories",
                    "category": "IT",
                    "timezone": "UTC",
                    "status": "draft",
                    "contractType": "671c2f0d9f4e2b0012345678",
                    "contractRelationship": "standalone",
                    "rating": 6,
                    "approvaers": [
                      {
                        "user": [
                          "approver1@example.com"
                        ],
                        "groupName": "Group 1",
                        "levelName": 1,
                        "amount": 50000
                      },
                      {
                        "user": [
                          "approver2@example.com",
                          "approver3@example.com"
                        ],
                        "groupName": "Group 2",
                        "levelName": 2,
                        "amount": 100000
                      }
                    ]
                  }
                },
                "full": {
                  "summary": "Comprehensive contract with all fields",
                  "value": {
                    "projectId": "66fb1c7a8d2eaa0012345678",
                    "msaContractId": "671c2f0d9f4e2b0012345679",
                    "solicitationId": "671c2f0d9f4e2b0012345680",
                    "contractType": "671c2f0d9f4e2b0012345678",
                    "timezone": "America/New_York",
                    "status": "publish",
                    "contractPaymentTerm": "671c2f0d9f4e2b0099999999",
                    "contractTermType": "671c2f0d9f4e2b0088888888",
                    "title": "Full Contract Example",
                    "contractRelationship": "project",
                    "category": "Construction",
                    "businessDivision": "671c2f0d9f4e2b0012345678",
                    "contractId": "CTR-2026-001",
                    "description": "A comprehensive contract example covering all fields.",
                    "jobTitle": "Project Manager",
                    "rating": 9,
                    "vendor": "vendor@example.com",
                    "personnel": [
                      {
                        "name": "John Doe",
                        "role": "Project Lead",
                        "email": "john.doe@example.com",
                        "phone": "+1-555-0123"
                      }
                    ],
                    "internalTeam": [
                      "671c2f0d9f4e2b0012345678"
                    ],
                    "visibility": "private",
                    "contractAmount": 1000000,
                    "contigency": "10%",
                    "holdBack": 50000,
                    "paymentTerm": "Net 30",
                    "paymentStructure": "Milestone",
                    "deliverable": {
                      "name": "Initial Setup",
                      "dueDate": "2026-01-20"
                    },
                    "milestone": [
                      {
                        "amount": 250000,
                        "dueDate": "2026-03-01",
                        "name": "Phase 1 Completion"
                      }
                    ],
                    "startDate": "2026-01-15",
                    "endDate": "2026-12-31",
                    "duration": 350,
                    "termType": "Fixed",
                    "contractFormationStage": {
                      "draft": {
                        "startDate": "2026-01-01",
                        "endDate": "2026-01-05"
                      },
                      "review": {
                        "startDate": "2026-01-06",
                        "endDate": "2026-01-10"
                      },
                      "approval": {
                        "startDate": "2026-01-11",
                        "endDate": "2026-01-12"
                      },
                      "execution": {
                        "startDate": "2026-01-13",
                        "endDate": "2026-01-14"
                      }
                    },
                    "deliverables": [
                      {
                        "name": "Final Report",
                        "dueDate": "2026-12-15"
                      }
                    ],
                    "insurance": {
                      "insurance": "Comprehensive General Liability",
                      "contractSecurity": true,
                      "contractSecurityType": [
                        {
                          "securityType": "Performance Bond",
                          "amount": 50000,
                          "dueDate": "2026-01-20"
                        }
                      ],
                      "expiryDate": "2027-01-20",
                      "policy": [
                        {
                          "policyName": "General",
                          "limit": "2000000"
                        }
                      ]
                    },
                    "files": [
                      {
                        "name": "contract_draft.pdf",
                        "url": "https://example.com/contract_draft.pdf",
                        "type": "application/pdf",
                        "size": 102400
                      }
                    ],
                    "signatories": [
                      "user object id",
                      "user object id"
                    ],
                    "approvaers": [
                      {
                        "user": [
                          "approver1@example.com"
                        ],
                        "groupName": "Finance",
                        "levelName": 1,
                        "amount": 1000000
                      }
                    ]
                  }
                }
              }
            },
            "application/xml": {
              "examples": {
                "basicXml": {
                  "summary": "Minimal valid contract (XML)",
                  "value": "\u003CCreateContractInput\u003E\n  \u003Ctitle\u003EJanitorial Services\u003C/title\u003E\n  \u003Cdescription\u003ERoutine office cleaning services\u003C/description\u003E\n  \u003Ccategory\u003EFacilities\u003C/category\u003E\n  \u003Ctimezone\u003EAmerica/New_York\u003C/timezone\u003E\n  \u003Cstatus\u003Epublish\u003C/status\u003E\n  \u003CpaymentStructure\u003EMonthly\u003C/paymentStructure\u003E\n  \u003CcontractType\u003E671c2f0d9f4e2b0012345678\u003C/contractType\u003E\n  \u003CcontractRelationship\u003Estandalone\u003C/contractRelationship\u003E\n  \u003Crating\u003E8\u003C/rating\u003E\n\u003C/CreateContractInput\u003E\n"
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseContract"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "422": {
            "description": "Validation error (zod/mongoose)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ValidationError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "List contracts",
        "description": "Returns contracts belonging to the authenticated user's company.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "responses": {
          "200": {
            "description": "Contracts fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseContractList"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/payment-holdbacks": {
      "post": {
        "summary": "Create a new holdback",
        "description": "Creates a new holdback for a specific contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractHoldBackDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Holdback created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Holdback created successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractHoldBackDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "List holdbacks",
        "description": "List all holdbacks for a contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Holdbacks fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Holdbacks fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ContractHoldBackDTO"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/payment-holdbacks/{holdBackId}": {
      "get": {
        "summary": "Get holdback details",
        "description": "Get details of a specific holdback.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "holdBackId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Holdback ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Holdback fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Holdback fetched successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractHoldBackDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/payment-savings": {
      "post": {
        "summary": "Create a new saving",
        "description": "Creates a new saving for a specific contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractSavingDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Savings created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Savings created successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractSavingDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "List savings",
        "description": "List all savings for a contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Savings fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Savings fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ContractSavingDTO"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/payment-savings/{savingId}": {
      "get": {
        "summary": "Get saving details",
        "description": "Get details of a specific saving.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "savingId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Saving ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Saving fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractSavingDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/changes/stats": {
      "get": {
        "summary": "Get contract change statistics",
        "description": "Returns statistics about changes for a specific contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract change stats fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "all": {
                          "type": "integer"
                        },
                        "request": {
                          "type": "integer"
                        },
                        "order": {
                          "type": "integer"
                        },
                        "directive": {
                          "type": "integer"
                        },
                        "proposal": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/changes": {
      "get": {
        "summary": "List contract changes",
        "description": "Returns a list of changes for a specific contract with filtering options.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by change title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by change type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract changes fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract changes fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "changes": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/ContractChangeDTO"
                          }
                        },
                        "total": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/changes/{changeId}": {
      "get": {
        "summary": "Get a contract change",
        "description": "Returns details of a specific contract change.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract change fetched successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractChangeDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{dataId}/change/{type}": {
      "post": {
        "summary": "Request a contract change",
        "description": "Creates a new contract change request.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "dataId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract or MSA ID"
          },
          {
            "in": "path",
            "name": "type",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "Contract",
                "MsaContract"
              ]
            },
            "description": "The type of document (Contract or MsaContract)"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractChangeManagerDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract change requested successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract change requested successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractChangeDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/changes/{changeId}/approve": {
      "post": {
        "summary": "Approve or reject a contract change (Manager)",
        "description": "Allows a manager or creator to approve/reject a contract change.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApprovalActionDTO"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract change approval processed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Manager approval saved successfully"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request (e.g. already approved)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ValidationError"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/changes/{changeId}/approve/status": {
      "get": {
        "summary": "Check manager approval status for a contract change",
        "description": "Returns the current manager approval status for a specific contract change.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Manager change status fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Manager change status fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": "string",
                          "example": "pending"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/changes/{changeId}/approvers": {
      "get": {
        "summary": "Get contract change approvers",
        "description": "Returns the list of approvers for a specific contract change.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change approvers fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract change approvers fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ContractChangeApprover"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/claims/{claimId}/approve": {
      "post": {
        "summary": "Approve or reject a contract claim (Manager)",
        "description": "Allows a manager or creator to approve/reject a contract claim.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApprovalActionDTO"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract claim approval processed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract Claim updated"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/claims/{claimId}/approve/status": {
      "get": {
        "summary": "Check manager approval status for a contract claim",
        "description": "Returns the current manager approval status for a specific contract claim.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Manager claim status fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Manager claim status fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "status": {
                          "type": "string",
                          "example": "pending"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/changes/{changeId}/comments": {
      "get": {
        "summary": "Get contract change comments",
        "description": "Returns comments for a specific contract change.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract change comments fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/ContractCommentDTO"
                          }
                        },
                        "page": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/changes/{changeId}/comments/{contractId}": {
      "post": {
        "summary": "Add a comment to a contract change",
        "description": "Adds a new comment to a specific contract change.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          },
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractChangeCommentDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract change comment added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract change comment added successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractCommentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/changes/{changeId}/comments/{commentId}/reply": {
      "post": {
        "summary": "Reply to a contract change comment",
        "description": "Adds a reply to a specific comment on a contract change.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          },
          {
            "in": "path",
            "name": "commentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The comment ID being replied to"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractChangeReplyDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract change reply added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract change reply added successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractCommentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/claims/stats": {
      "get": {
        "summary": "Get contract claim statistics",
        "description": "Returns statistics about claims for a specific contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claim stats fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "total": {
                          "type": "integer"
                        },
                        "pending": {
                          "type": "integer"
                        },
                        "approved": {
                          "type": "integer"
                        },
                        "rejected": {
                          "type": "integer"
                        },
                        "dispute": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/claims": {
      "get": {
        "summary": "List contract claims",
        "description": "Returns a list of claims for a specific contract with filtering options.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by claim title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by claim type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claims fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claims fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "changes": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/ContractClaimDTO"
                          }
                        },
                        "total": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/claims/{claimId}": {
      "get": {
        "summary": "Get a contract claim",
        "description": "Returns details of a specific contract claim.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claim fetched successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractClaimDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/claims/{claimId}/comments": {
      "get": {
        "summary": "Get contract claim comments",
        "description": "Returns comments for a specific contract claim.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claim comments fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/ContractCommentDTO"
                          }
                        },
                        "page": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/claims/{claimId}/comments/{contractId}": {
      "post": {
        "summary": "Add a comment to a contract claim",
        "description": "Adds a new comment to a specific contract claim.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          },
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractChangeCommentDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract claim comment added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claim comment added successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractCommentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/claims/{claimId}/comments/{commentId}/reply": {
      "post": {
        "summary": "Reply to a contract claim comment",
        "description": "Adds a reply to a specific comment on a contract claim.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          },
          {
            "in": "path",
            "name": "commentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The comment ID being replied to"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractChangeReplyDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract claim reply added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claim reply added successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractCommentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/claims/{claimId}/approvers": {
      "get": {
        "summary": "Get contract claim approvers",
        "description": "Returns the list of approvers for a specific contract claim.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim approvers fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claim approvers fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ContractChangeApprover"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Send contract claim to approvers",
        "description": "Sends the contract claim to the specified approvers.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "userIds"
                ],
                "properties": {
                  "userIds": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Array of user IDs to send the claim to"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract claim approver sent successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract claim approver sent successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractClaimDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/invoice/stats": {
      "get": {
        "summary": "Get contract invoice statistics",
        "description": "Returns statistics for invoices associated with a specific contract",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice statistics fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "all": {
                          "type": "integer"
                        },
                        "pending": {
                          "type": "integer"
                        },
                        "accepted": {
                          "type": "integer"
                        },
                        "rejected": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/invoice": {
      "get": {
        "summary": "List contract invoices",
        "description": "Returns a paginated list of invoices for a specific contract",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "query",
            "name": "invoiceId",
            "schema": {
              "type": "string"
            },
            "description": "Filter by invoice ID"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoices fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "invoices": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/ContractInvoiceDTO"
                          }
                        },
                        "total": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/invoice/{invoiceId}": {
      "get": {
        "summary": "Get contract invoice details",
        "description": "Returns detailed information for a specific contract invoice",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Invoice ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractInvoiceDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/amendments/stats": {
      "get": {
        "summary": "Get amendment statistics",
        "description": "Returns statistics for contract amendments.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Amendment stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "accepted": {
                          "type": "integer"
                        },
                        "all": {
                          "type": "integer"
                        },
                        "rejected": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/amendments": {
      "get": {
        "summary": "List amendments",
        "description": "List all amendments for a contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Amendments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ContractAmendmentDTO"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create amendment",
        "description": "Create a new amendment for a contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractAmendmentDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Amendment created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractAmendmentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/amendments/{amendmentId}": {
      "get": {
        "summary": "Get amendment details",
        "description": "Returns details of a specific amendment.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Amendment ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Amendment fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractAmendmentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/amendments/{amendmentId}/approvers": {
      "post": {
        "summary": "Add approvers to amendment",
        "description": "Manually add approvers to a contract amendment.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Amendment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AddApproversDTO"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Approvers added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractAmendmentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/amendments/{amendmentId}/approve": {
      "post": {
        "summary": "Approve/Reject amendment",
        "description": "Approve or reject a contract amendment.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Amendment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ApprovalActionDTO"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Amendment approval status updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractAmendmentDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{dataId}/rfi/{type}": {
      "post": {
        "summary": "Create a new RFI issue",
        "description": "Creates a new RFI issue for a contract or MSA contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "dataId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract or MSA contract ID"
          },
          {
            "in": "path",
            "name": "type",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "Contract",
                "MsaContract"
              ]
            },
            "description": "The type of data (Contract or MsaContract)"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractRfiDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract RFI created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract RFI created successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractRfiDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/{contractId}/rfis": {
      "get": {
        "summary": "List contract RFIs",
        "description": "Returns a paginated list of RFIs for a specific contract.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by RFI title"
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string"
            },
            "description": "Filter by RFI status"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract RFIs fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract RFIs fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "contractRfis": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/ContractRfiDTO"
                          }
                        },
                        "total": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "skip": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/rfis/{rfiId}": {
      "get": {
        "summary": "Get a specific RFI",
        "description": "Returns details of a specific RFI.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "rfiId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The RFI ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract RFI fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract RFI fetched successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractRfiDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/contracts/rfis/{rfiId}/response": {
      "post": {
        "summary": "Add response to RFI",
        "description": "Adds a response to a specific RFI.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "rfiId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The RFI ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ContractRfiResponseDTO"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract RFI response added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract RFI response added successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractRfiResponseDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "Get RFI response",
        "description": "Returns the response for a specific RFI.",
        "tags": [
          "ContractManager - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "contract_manager",
          "procurement",
          "view_only",
          "approver",
          "company_admin"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "rfiId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The RFI ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract RFI response fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Contract RFI response fetched successfully"
                    },
                    "data": {
                      "$ref": "#/components/schemas/ContractRfiResponseDTO"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/projects/stats": {
      "get": {
        "summary": "Get project statistics",
        "description": "Returns aggregate counts of projects for the authenticated user's company.",
        "tags": [
          "Project"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "responses": {
          "200": {
            "description": "Project stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseProjectStats"
                },
                "examples": {
                  "stats": {
                    "value": {
                      "status": 200,
                      "message": "Project stats fetched successfully",
                      "data": {
                        "all": 42,
                        "active": 18,
                        "completed": 20,
                        "cancelled": 4
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/projects/{projectId}": {
      "get": {
        "summary": "Get a project by ID",
        "description": "Returns a single project belonging to the authenticated user's company.",
        "tags": [
          "Project"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "projectId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The project ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Project fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseProject"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "404": {
            "description": "Project not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NotFoundError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/projects/{projectId}/contracts": {
      "get": {
        "summary": "List contracts linked to a project",
        "description": "Returns contracts linked to the specified project within the authenticated user's company.",
        "tags": [
          "Project"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "view_only",
          "approver",
          "company_admin",
          "contract_manager",
          "procurement"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "projectId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The project ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Project contracts fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseContractList"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "404": {
            "description": "Project not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NotFoundError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/manager/projects/{projectId}/complete": {
      "patch": {
        "summary": "Mark project as complete",
        "description": "Updates project status to `completed`.",
        "tags": [
          "Project"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "x-roles": [
          "procurement",
          "contract_manager"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "projectId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The project ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Project marked as complete successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiResponseProject"
                }
              }
            }
          },
          "401": {
            "description": "Unauthenticated user",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthenticatedError"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden – user lacks required role",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthorizeError"
                }
              }
            }
          },
          "404": {
            "description": "Project not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NotFoundError"
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ServerError"
                }
              }
            }
          }
        }
      }
    },
    "/user/contract/stats": {
      "get": {
        "summary": "Get contract statistics",
        "description": "Returns statistics of contracts for the authenticated user's company (view_only role context).",
        "tags": [
          "User - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Contract stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract stats fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "all": {
                          "type": "integer"
                        },
                        "active": {
                          "type": "integer"
                        },
                        "draft": {
                          "type": "integer"
                        },
                        "completed": {
                          "type": "integer"
                        },
                        "pending": {
                          "type": "integer"
                        },
                        "cancelled": {
                          "type": "integer"
                        },
                        "suspended": {
                          "type": "integer"
                        },
                        "expired": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract": {
      "get": {
        "summary": "List contracts",
        "description": "Returns a paginated list of contracts for the authenticated user's company.",
        "tags": [
          "User - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": [
                "draft",
                "pending_approval",
                "active",
                "completed",
                "suspended",
                "expired",
                "terminated"
              ]
            },
            "description": "Filter by contract status"
          },
          {
            "in": "query",
            "name": "category",
            "schema": {
              "type": "string"
            },
            "description": "Filter by contract category"
          },
          {
            "in": "query",
            "name": "date",
            "schema": {
              "type": "string",
              "format": "date"
            },
            "description": "Filter by date (YYYY-MM-DD)"
          }
        ],
        "responses": {
          "200": {
            "description": "Contracts fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contracts fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "contracts": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "totalContracts": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/change/stats": {
      "get": {
        "summary": "Get contract change statistics",
        "description": "Returns statistics for changes associated with a specific contract.",
        "tags": [
          "User - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/change": {
      "get": {
        "summary": "List contract changes",
        "description": "Returns a paginated list of changes for a specific contract.",
        "tags": [
          "User - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by change title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by change type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract changes fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract changes fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/change/{changeId}": {
      "get": {
        "summary": "Get contract change details",
        "description": "Returns detailed information for a specific contract change.",
        "tags": [
          "User - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract change not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/change/{changeId}/comment": {
      "get": {
        "summary": "Get contract change comments",
        "description": "Returns comments for a specific contract change.",
        "tags": [
          "User - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change comments fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract change not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}": {
      "get": {
        "summary": "Get contract details",
        "description": "Returns detailed information for a specific contract.",
        "tags": [
          "User - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "description": "Contract object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/claim/stats": {
      "get": {
        "summary": "Get contract claim statistics",
        "description": "Returns statistics for claims associated with a specific contract.",
        "tags": [
          "User - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/claim": {
      "get": {
        "summary": "List contract claims",
        "description": "Returns a paginated list of claims for a specific contract.",
        "tags": [
          "User - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by claim title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by claim type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claims fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claims fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/claim/{claimId}": {
      "get": {
        "summary": "Get contract claim details",
        "description": "Returns detailed information for a specific contract claim.",
        "tags": [
          "User - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract claim not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/claim/{claimId}/comment": {
      "get": {
        "summary": "Get contract claim comments",
        "description": "Returns comments for a specific contract claim.",
        "tags": [
          "User - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim comments fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract claim not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/invoice/stats": {
      "get": {
        "summary": "Get contract invoice statistics",
        "description": "Returns statistics for invoices associated with a specific contract.",
        "tags": [
          "User - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract invoice stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/invoice": {
      "get": {
        "summary": "List contract invoices",
        "description": "Returns a paginated list of invoices for a specific contract.",
        "tags": [
          "User - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "invoiceId",
            "schema": {
              "type": "string"
            },
            "description": "Filter by invoice ID"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by invoice type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoices fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract invoices fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "invoices": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "total": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/invoice/{invoiceId}": {
      "get": {
        "summary": "Get contract invoice details",
        "description": "Returns detailed information for a specific contract invoice.",
        "tags": [
          "User - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract invoice ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract invoice fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract invoice not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/lem": {
      "get": {
        "summary": "List contract LEMs",
        "description": "Returns a paginated list of LEMs for a specific contract.",
        "tags": [
          "User - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "lemId",
            "schema": {
              "type": "string"
            },
            "description": "Filter by LEM ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by LEM title"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract LEMs fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract LEMs fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/lem/{lemId}": {
      "get": {
        "summary": "Get contract LEM details",
        "description": "Returns detailed information for a specific contract LEM.",
        "tags": [
          "User - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "lemId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract LEM ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract LEM fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract LEM fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract LEM not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/amendment/stats": {
      "get": {
        "summary": "Get contract amendment statistics",
        "description": "Returns statistics for amendments associated with a specific contract.",
        "tags": [
          "User - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendment stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/amendment": {
      "get": {
        "summary": "List contract amendments",
        "description": "Returns a list of amendments for a specific contract.",
        "tags": [
          "User - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendments fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/user/contract/{contractId}/amendment/{amendmentId}": {
      "get": {
        "summary": "Get contract amendment details",
        "description": "Returns detailed information for a specific contract amendment.",
        "tags": [
          "User - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract amendment ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendment fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract amendment not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/stats": {
      "get": {
        "summary": "Get vendor contract statistics",
        "description": "Returns statistics of contracts for the authenticated vendor (active, all, completed, cancelled, suspended, expired).",
        "tags": [
          "Vendor - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Vendor stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Vendor stats fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "all": {
                          "type": "integer"
                        },
                        "active": {
                          "type": "integer"
                        },
                        "completed": {
                          "type": "integer"
                        },
                        "cancelled": {
                          "type": "integer"
                        },
                        "suspended": {
                          "type": "integer"
                        },
                        "expired": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract": {
      "get": {
        "summary": "List vendor contracts",
        "description": "Returns a paginated list of contracts for the authenticated vendor.",
        "tags": [
          "Vendor - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": [
                "active",
                "completed",
                "terminated",
                "suspended",
                "expired"
              ]
            },
            "description": "Filter by contract status"
          },
          {
            "in": "query",
            "name": "category",
            "schema": {
              "type": "string"
            },
            "description": "Filter by contract category"
          },
          {
            "in": "query",
            "name": "date",
            "schema": {
              "type": "string",
              "format": "date"
            },
            "description": "Filter by date (YYYY-MM-DD)"
          }
        ],
        "responses": {
          "200": {
            "description": "Contracts fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contracts fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "contracts": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "_id": {
                                "type": "string"
                              },
                              "title": {
                                "type": "string"
                              },
                              "contractId": {
                                "type": "string"
                              },
                              "contractValue": {
                                "type": "number"
                              },
                              "status": {
                                "type": "string"
                              },
                              "startDate": {
                                "type": "string",
                                "format": "date-time"
                              },
                              "endDate": {
                                "type": "string",
                                "format": "date-time"
                              },
                              "createdAt": {
                                "type": "string",
                                "format": "date-time"
                              },
                              "vendor": {
                                "type": "object",
                                "properties": {
                                  "name": {
                                    "type": "string"
                                  }
                                }
                              }
                            }
                          }
                        },
                        "totalContracts": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/change/{changeId}/comment/{commentId}/reply": {
      "post": {
        "summary": "Reply to a contract change comment",
        "description": "Adds a reply to a specific comment on a contract change.",
        "tags": [
          "Vendor - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          },
          {
            "in": "path",
            "name": "commentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The comment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content",
                  "parentCommentId"
                ],
                "properties": {
                  "parentCommentId": {
                    "type": "string",
                    "description": "The ID of the parent comment"
                  },
                  "content": {
                    "type": "string",
                    "description": "The reply content"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract change reply added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change reply added successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Comment or Change not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/change/stats": {
      "get": {
        "summary": "Get contract change statistics",
        "description": "Returns statistics for changes associated with a specific contract.",
        "tags": [
          "Vendor - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/change": {
      "get": {
        "summary": "List contract changes",
        "description": "Returns a paginated list of changes for a specific contract.",
        "tags": [
          "Vendor - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by change title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by change type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract changes fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract changes fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      },
      "post": {
        "summary": "Request a contract change",
        "description": "Creates a new contract change request.",
        "tags": [
          "Vendor - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "title",
                  "description",
                  "type"
                ],
                "properties": {
                  "title": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "request",
                      "directive",
                      "proposal"
                    ]
                  },
                  "proposalCategory": {
                    "type": "string"
                  },
                  "urgency": {
                    "type": "string",
                    "enum": [
                      "low",
                      "medium",
                      "high"
                    ]
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "number"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract change requested successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change requested successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/change/{changeId}": {
      "get": {
        "summary": "Get contract change details",
        "description": "Returns detailed information for a specific contract change.",
        "tags": [
          "Vendor - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract change not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/change/{changeId}/comment": {
      "get": {
        "summary": "Get contract change comments",
        "description": "Returns comments for a specific contract change.",
        "tags": [
          "Vendor - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract change comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change comments fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract change not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      },
      "post": {
        "summary": "Add a comment to a contract change",
        "description": "Adds a new comment to a specific contract change.",
        "tags": [
          "Vendor - Contract Change"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "changeId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract change ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content"
                ],
                "properties": {
                  "content": {
                    "type": "string",
                    "description": "The comment content"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract change comment added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract change comment added successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract change not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}": {
      "get": {
        "summary": "Get contract details",
        "description": "Returns detailed information for a specific contract.",
        "tags": [
          "Vendor - Contract"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "description": "Contract object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/claim/stats": {
      "get": {
        "summary": "Get contract claim statistics",
        "description": "Returns statistics for claims associated with a specific contract.",
        "tags": [
          "Vendor - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/claim": {
      "get": {
        "summary": "List contract claims",
        "description": "Returns a paginated list of claims for a specific contract.",
        "tags": [
          "Vendor - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by claim title"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by claim type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claims fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claims fetched successfully"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "docs": {
                          "type": "array",
                          "items": {
                            "type": "object"
                          }
                        },
                        "totalDocs": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "totalPages": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      },
      "post": {
        "summary": "Create a contract claim",
        "description": "Creates a new contract claim.",
        "tags": [
          "Vendor - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "title",
                  "description",
                  "type",
                  "priority"
                ],
                "properties": {
                  "title": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "type": {
                    "type": "string"
                  },
                  "priority": {
                    "type": "string",
                    "enum": [
                      "low",
                      "medium",
                      "high"
                    ]
                  },
                  "cost": {
                    "type": "number"
                  },
                  "impact": {
                    "type": "string"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "number"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract claim created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim created successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/claim/{claimId}": {
      "get": {
        "summary": "Get contract claim details",
        "description": "Returns detailed information for a specific contract claim.",
        "tags": [
          "Vendor - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract claim not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/claim/{claimId}/comment": {
      "get": {
        "summary": "Get contract claim comments",
        "description": "Returns comments for a specific contract claim.",
        "tags": [
          "Vendor - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract claim comments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim comments fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract claim not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      },
      "post": {
        "summary": "Add a comment to a contract claim",
        "description": "Adds a new comment to a specific contract claim.",
        "tags": [
          "Vendor - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content"
                ],
                "properties": {
                  "content": {
                    "type": "string",
                    "description": "The comment content"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract claim comment added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim comment added successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract claim not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/claim/{claimId}/comment/{commentId}/reply": {
      "post": {
        "summary": "Reply to a contract claim comment",
        "description": "Adds a reply to a specific comment on a contract claim.",
        "tags": [
          "Vendor - Contract Claim"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "claimId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract claim ID"
          },
          {
            "in": "path",
            "name": "commentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The comment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "content",
                  "parentCommentId"
                ],
                "properties": {
                  "parentCommentId": {
                    "type": "string",
                    "description": "The ID of the parent comment"
                  },
                  "content": {
                    "type": "string",
                    "description": "The reply content"
                  },
                  "files": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "url": {
                          "type": "string"
                        },
                        "type": {
                          "type": "string"
                        },
                        "size": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Contract claim reply added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract claim reply added successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Comment or Claim not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/invoice/stats": {
      "get": {
        "summary": "Get contract invoice statistics",
        "description": "Returns statistics for invoices associated with a specific contract",
        "tags": [
          "Vendor - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice statistics fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/vendor/contract/{contractId}/invoice": {
      "post": {
        "summary": "Create a new contract invoice",
        "description": "Create a new invoice for a specific contract",
        "tags": [
          "Vendor - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/IContractInvoice"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract invoice created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "List contract invoices",
        "description": "Returns a paginated list of invoices for a specific contract",
        "tags": [
          "Vendor - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "query",
            "name": "invoiceId",
            "schema": {
              "type": "string"
            },
            "description": "Filter by invoice ID"
          },
          {
            "in": "query",
            "name": "type",
            "schema": {
              "type": "string"
            },
            "description": "Filter by invoice type"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoices fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/vendor/contract/{contractId}/invoice/{invoiceId}": {
      "get": {
        "summary": "Get contract invoice details",
        "description": "Returns detailed information for a specific contract invoice",
        "tags": [
          "Vendor - Contract Invoice"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Invoice ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract invoice fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Contract invoice not found"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/lem": {
      "post": {
        "summary": "Create a new contract LEM",
        "description": "Create a new LEM for a specific contract",
        "tags": [
          "Vendor - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/IContractLem"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract LEM created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "List contract LEMs",
        "description": "Returns a paginated list of LEMs for a specific contract",
        "tags": [
          "Vendor - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "query",
            "name": "lemId",
            "schema": {
              "type": "string"
            },
            "description": "Filter by LEM ID"
          },
          {
            "in": "query",
            "name": "title",
            "schema": {
              "type": "string"
            },
            "description": "Filter by LEM title"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract LEMs fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/vendor/contract/{contractId}/lem/{lemId}": {
      "get": {
        "summary": "Get contract LEM details",
        "description": "Returns detailed information for a specific contract LEM",
        "tags": [
          "Vendor - Contract LEM"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Contract ID"
          },
          {
            "in": "path",
            "name": "lemId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "LEM ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract LEM fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Contract LEM not found"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/amendment/stats": {
      "get": {
        "summary": "Get contract amendment statistics",
        "description": "Returns statistics for amendments associated with a specific contract.",
        "tags": [
          "Vendor - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendment stats fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment stats fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/amendment": {
      "get": {
        "summary": "List contract amendments",
        "description": "Returns a list of amendments for a specific contract.",
        "tags": [
          "Vendor - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendments fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendments fetched successfully"
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/amendment/{amendmentId}": {
      "get": {
        "summary": "Get contract amendment details",
        "description": "Returns detailed information for a specific contract amendment.",
        "tags": [
          "Vendor - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract amendment ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Contract amendment fetched successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment fetched successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Contract amendment not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    },
    "/vendor/contract/{contractId}/amendment/{amendmentId}/status": {
      "patch": {
        "summary": "Update contract amendment vendor status",
        "description": "Updates the vendor status of a specific contract amendment (accepted/rejected).",
        "tags": [
          "Vendor - Contract Amendment"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "contractId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract ID"
          },
          {
            "in": "path",
            "name": "amendmentId",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The contract amendment ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": [
                      "accepted",
                      "rejected"
                    ],
                    "description": "The new status for the amendment"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Contract amendment vendor status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Contract amendment vendor status updated successfully"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - Not authorized to update this amendment"
          },
          "404": {
            "description": "Contract amendment not found"
          },
          "500": {
            "description": "Server error"
          }
        }
      }
    }
  },
  "tags": [
    {
      "name": "Approver - Contract",
      "description": "Contract management for approvers"
    },
    {
      "name": "Approver - Contract Change",
      "description": "Contract change management for approvers"
    },
    {
      "name": "Approver - Contract LEM",
      "description": "Contract LEM management for approvers"
    },
    {
      "name": "Business Division",
      "description": "Business Division management"
    },
    {
      "name": "Project",
      "description": "API endpoint for managing project"
    },
    {
      "name": "ContractManager - Contract",
      "description": "API endpoint for managing contract"
    },
    {
      "name": "Vendor-Contract",
      "description": "API endpoint for managing vendor contract"
    }
  ]
}